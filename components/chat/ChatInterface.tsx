/* eslint-disable no-undef */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  AlertCircle,
  Loader2,
  MessageSquare,
  Plus,
  Pencil,
  Check,
  X,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import {
  useAIToolBySlug,
  useChatMessages,
  useConversationsByTool,
} from '../../hooks/useChatHistory';
import { createConversation, updateConversation } from '../../services/chat-supabase';
import { ChatMessage as ChatMessageType, ChatConversation } from '../../types/chat-types';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatInterfaceProps {
  toolSlug: string;
  studentId: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ toolSlug, studentId }) => {
  const { data: tool, isLoading: toolLoading, error: toolError } = useAIToolBySlug(toolSlug);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const prevToolSlugRef = useRef<string>(toolSlug);

  // Fetch conversations for this tool
  const { data: conversations, refetch: refetchConversations } = useConversationsByTool(
    studentId,
    tool?.id
  );

  // Fetch existing messages when conversation is set
  const { data: existingMessages } = useChatMessages(conversationId || undefined);

  // Reset state when tool changes
  useEffect(() => {
    if (prevToolSlugRef.current !== toolSlug) {
      setConversationId(null);
      setMessages([]);
      setStreamingMessage('');
      setError(null);
      prevToolSlugRef.current = toolSlug;
    }
  }, [toolSlug]);

  // Load most recent conversation when tool loads
  useEffect(() => {
    if (tool && studentId && !conversationId && conversations !== undefined) {
      if (conversations && conversations.length > 0) {
        setConversationId(conversations[0].id);
      }
    }
  }, [tool, studentId, conversationId, conversations]);

  // Load existing messages
  useEffect(() => {
    if (existingMessages) {
      setMessages(existingMessages);
    } else {
      setMessages([]);
    }
  }, [existingMessages]);

  // Scroll to bottom on new messages - only within container
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  const handleNewChat = useCallback(async () => {
    if (!tool || !studentId) return;

    try {
      const newConv = await createConversation({ studentId, toolId: tool.id, title: 'New Chat' });
      setConversationId(newConv.id);
      setMessages([]);
      setStreamingMessage('');
      setError(null);
      refetchConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    }
  }, [tool, studentId, refetchConversations]);

  const handleSelectConversation = useCallback(
    (convId: string) => {
      if (convId === conversationId) return;
      setConversationId(convId);
      setMessages([]);
      setStreamingMessage('');
      setError(null);
    },
    [conversationId]
  );

  const handleRenameConversation = useCallback(
    async (convId: string, newTitle: string) => {
      try {
        await updateConversation(convId, { title: newTitle });
        refetchConversations();
        setEditingConvId(null);
      } catch (err) {
        console.error('Failed to rename conversation:', err);
      }
    },
    [refetchConversations]
  );

  const startEditing = (conv: ChatConversation) => {
    setEditingConvId(conv.id);
    setEditingTitle(conv.title || 'Untitled');
  };

  const sendMessage = useCallback(
    async (content: string) => {
      if (!tool || isStreaming) return;

      let activeConversationId = conversationId;

      // Create conversation if none exists
      if (!activeConversationId) {
        try {
          const newConv = await createConversation({
            studentId,
            toolId: tool.id,
            title: content.substring(0, 50),
          });
          activeConversationId = newConv.id;
          setConversationId(newConv.id);
          refetchConversations();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to create conversation');
          return;
        }
      }

      setError(null);
      setIsStreaming(true);

      // Add user message optimistically
      const userMessage: ChatMessageType = {
        id: `temp-${Date.now()}`,
        conversationId: activeConversationId,
        role: 'user',
        content,
        inputTokens: null,
        outputTokens: null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setStreamingMessage('');

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
          throw new Error('Supabase URL not configured');
        }

        abortControllerRef.current = new AbortController();

        const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            conversationId: activeConversationId,
            message: content,
            studentId,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response stream available');
        }

        const decoder = new TextDecoder();
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'delta' && data.text) {
                  accumulatedContent += data.text;
                  setStreamingMessage(accumulatedContent);
                } else if (data.type === 'done') {
                  const assistantMessage: ChatMessageType = {
                    id: `msg-${Date.now()}`,
                    conversationId: activeConversationId,
                    role: 'assistant',
                    content: accumulatedContent,
                    inputTokens: data.usage?.inputTokens || null,
                    outputTokens: data.usage?.outputTokens || null,
                    createdAt: new Date().toISOString(),
                  };
                  setMessages((prev) => [...prev, assistantMessage]);
                  setStreamingMessage('');
                } else if (data.type === 'error') {
                  throw new Error(data.error || 'Stream error');
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err.message : 'An error occurred');
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [tool, conversationId, studentId, isStreaming, refetchConversations]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  if (toolLoading) {
    return (
      <div className="w-full h-[600px] bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (toolError || !tool) {
    return (
      <div className="w-full h-[600px] bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-1">AI Tool Not Found</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            The requested AI tool "{toolSlug}" could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  const showWelcome = messages.length === 0 && !streamingMessage;

  return (
    <div className="w-full h-[700px] bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex overflow-hidden">
      {/* Conversation Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-200 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden`}
      >
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            Chats
          </span>
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
            title="New Chat"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations && conversations.length > 0 ? (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  conv.id === conversationId
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
                onClick={() => handleSelectConversation(conv.id)}
              >
                <MessageSquare size={14} className="shrink-0" />
                {editingConvId === conv.id ? (
                  <div className="flex-1 flex items-center gap-1">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="flex-1 px-1 py-0.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameConversation(conv.id, editingTitle);
                        } else if (e.key === 'Escape') {
                          setEditingConvId(null);
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameConversation(conv.id, editingTitle);
                      }}
                      className="p-0.5 text-green-600 hover:text-green-700"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingConvId(null);
                      }}
                      className="p-0.5 text-red-600 hover:text-red-700"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-xs truncate">{conv.title || 'Untitled'}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(conv);
                      }}
                      className="p-0.5 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-opacity"
                    >
                      <Pencil size={12} />
                    </button>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-zinc-400">No conversations yet</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
          <div className="flex-1">
            <ChatHeader tool={tool} onNewChat={handleNewChat} />
          </div>
        </div>

        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {showWelcome && tool.welcomeMessage && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-zinc-600 dark:text-zinc-300" />
              </div>
              <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                <p className="text-sm whitespace-pre-wrap">{tool.welcomeMessage}</p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {streamingMessage && (
            <ChatMessage
              message={{
                id: 'streaming',
                conversationId: conversationId || '',
                role: 'assistant',
                content: streamingMessage,
                inputTokens: null,
                outputTokens: null,
                createdAt: new Date().toISOString(),
              }}
              isStreaming
            />
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <ChatInput
            onSend={sendMessage}
            isLoading={isStreaming}
            placeholder={tool.welcomeMessage ? 'Type your message...' : 'Ask me anything...'}
            suggestedPrompts={showWelcome ? tool.suggestedPrompts || undefined : undefined}
          />
        </div>

        <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center gap-2">
          <Bot size={12} className="text-violet-500" />
          <span className="text-xs text-zinc-500">Powered by Claude AI</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
