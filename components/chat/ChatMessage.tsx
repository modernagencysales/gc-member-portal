import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../../types/chat-types';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

// Preprocess content to convert emoji lists to proper markdown
const preprocessMarkdown = (content: string): string => {
  return content
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      // Convert lines starting with list-like emojis to proper markdown lists
      if (/^[✅☑✓□☐◻◼•▪▸➡→►‣⁃]\s/.test(trimmed)) {
        return `- ${trimmed}`;
      }
      return line;
    })
    .join('\n');
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming }) => {
  const isUser = message.role === 'user';
  const processedContent = isUser ? message.content : preprocessMarkdown(message.content);

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-violet-500 text-white'
            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-violet-500 text-white rounded-br-md'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-md'
        }`}
      >
        <div className="text-sm break-words">
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }: { children?: React.ReactNode }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                ul: ({ children }: { children?: React.ReactNode }) => (
                  <ul className="list-none ml-0 mb-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }: { children?: React.ReactNode }) => (
                  <ol className="list-decimal ml-4 mb-2">{children}</ol>
                ),
                li: ({ children }: { children?: React.ReactNode }) => (
                  <li className="mb-1">{children}</li>
                ),
                strong: ({ children }: { children?: React.ReactNode }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                code: ({
                  children,
                  className,
                }: {
                  children?: React.ReactNode;
                  className?: string;
                }) => {
                  const isBlock = className?.includes('language-');
                  return isBlock ? (
                    <code className="block bg-zinc-200 dark:bg-zinc-900 rounded p-2 my-2 text-xs overflow-x-auto">
                      {children}
                    </code>
                  ) : (
                    <code className="bg-zinc-200 dark:bg-zinc-900 rounded px-1 py-0.5 text-xs">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }: { children?: React.ReactNode }) => (
                  <pre className="my-2">{children}</pre>
                ),
                h1: ({ children }: { children?: React.ReactNode }) => (
                  <h1 className="text-lg font-bold mb-2">{children}</h1>
                ),
                h2: ({ children }: { children?: React.ReactNode }) => (
                  <h2 className="text-base font-bold mb-2">{children}</h2>
                ),
                h3: ({ children }: { children?: React.ReactNode }) => (
                  <h3 className="text-sm font-bold mb-1">{children}</h3>
                ),
                a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
                  <a
                    href={href}
                    className="text-violet-600 dark:text-violet-400 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }: { children?: React.ReactNode }) => (
                  <blockquote className="border-l-2 border-zinc-300 dark:border-zinc-600 pl-3 italic my-2">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {processedContent}
            </ReactMarkdown>
          )}
          {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
