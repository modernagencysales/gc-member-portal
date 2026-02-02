// ============================================
// AI Chat System Types
// ============================================

export type MessageRole = 'user' | 'assistant';

// ============================================
// AI Tools
// ============================================

export interface AITool {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  model: string;
  maxTokens: number;
  welcomeMessage: string | null;
  suggestedPrompts: string[] | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIToolInput {
  slug: string;
  name: string;
  description?: string;
  systemPrompt: string;
  model?: string;
  maxTokens?: number;
  welcomeMessage?: string;
  suggestedPrompts?: string[];
  isActive?: boolean;
}

// ============================================
// Chat Conversations
// ============================================

export interface ChatConversation {
  id: string;
  studentId: string;
  toolId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversationWithTool extends ChatConversation {
  tool: AITool;
}

export interface ChatConversationInput {
  studentId: string;
  toolId: string;
  title?: string;
}

// ============================================
// Chat Messages
// ============================================

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  inputTokens: number | null;
  outputTokens: number | null;
  createdAt: string;
}

export interface ChatMessageInput {
  conversationId: string;
  role: MessageRole;
  content: string;
  inputTokens?: number;
  outputTokens?: number;
}

// ============================================
// Chat Request/Response for Edge Function
// ============================================

export interface ChatRequest {
  toolId?: string;
  toolSlug?: string;
  conversationId?: string;
  message: string;
  studentId: string;
}

export interface ChatResponse {
  conversationId: string;
  message: ChatMessage;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// For streaming responses
export interface ChatStreamChunk {
  type: 'content_block_delta' | 'message_start' | 'message_stop' | 'error';
  delta?: {
    type: string;
    text?: string;
  };
  message?: {
    id: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
    };
  };
  error?: string;
}

// ============================================
// Student Tool Credits
// ============================================

export interface StudentToolCredits {
  toolSlug: string;
  creditsRemaining: number;
}

// ============================================
// Conversation with Messages (for history)
// ============================================

export interface ConversationWithMessages extends ChatConversation {
  messages: ChatMessage[];
}
