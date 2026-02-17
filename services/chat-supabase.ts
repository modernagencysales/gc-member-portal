/**
 * Chat Supabase Service
 * Handles all database operations for the AI Chat System
 */

import { supabase } from '../lib/supabaseClient';
import {
  AITool,
  AIToolCategory,
  AIToolInput,
  ChatConversation,
  ChatConversationInput,
  ChatMessage,
  ChatMessageInput,
  ConversationWithMessages,
} from '../types/chat-types';

// Explicit column lists (avoid select('*'))
const AI_TOOL_COLUMNS =
  'id, slug, name, description, category, system_prompt, model, max_tokens, welcome_message, suggested_prompts, is_active, sort_order, created_at, updated_at';

const CONVERSATION_COLUMNS = 'id, student_id, tool_id, title, created_at, updated_at';

const MESSAGE_COLUMNS =
  'id, conversation_id, role, content, input_tokens, output_tokens, created_at';

// ============================================
// Mapping Functions
// ============================================

function mapAITool(data: Record<string, unknown>): AITool {
  return {
    id: data.id as string,
    slug: data.slug as string,
    name: data.name as string,
    description: data.description as string | null,
    category: (data.category as AIToolCategory) ?? null,
    systemPrompt: data.system_prompt as string,
    model: data.model as string,
    maxTokens: data.max_tokens as number,
    welcomeMessage: data.welcome_message as string | null,
    suggestedPrompts: data.suggested_prompts as string[] | null,
    isActive: data.is_active as boolean,
    sortOrder: (data.sort_order as number) ?? 0,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapChatConversation(data: Record<string, unknown>): ChatConversation {
  return {
    id: data.id as string,
    studentId: data.student_id as string,
    toolId: data.tool_id as string,
    title: data.title as string | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapChatMessage(data: Record<string, unknown>): ChatMessage {
  return {
    id: data.id as string,
    conversationId: data.conversation_id as string,
    role: data.role as 'user' | 'assistant',
    content: data.content as string,
    inputTokens: data.input_tokens as number | null,
    outputTokens: data.output_tokens as number | null,
    createdAt: data.created_at as string,
  };
}

// ============================================
// AI Tools
// ============================================

export async function fetchAllAITools(): Promise<AITool[]> {
  const { data, error } = await supabase
    .from('ai_tools')
    .select(AI_TOOL_COLUMNS)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapAITool);
}

export async function fetchActiveAITools(): Promise<AITool[]> {
  const { data, error } = await supabase
    .from('ai_tools')
    .select(AI_TOOL_COLUMNS)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapAITool);
}

export async function fetchAIToolById(toolId: string): Promise<AITool | null> {
  const { data, error } = await supabase
    .from('ai_tools')
    .select(AI_TOOL_COLUMNS)
    .eq('id', toolId)
    .single();

  if (error || !data) return null;
  return mapAITool(data);
}

export async function fetchAIToolBySlug(slug: string): Promise<AITool | null> {
  const { data, error } = await supabase
    .from('ai_tools')
    .select(AI_TOOL_COLUMNS)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return mapAITool(data);
}

export async function createAITool(tool: AIToolInput): Promise<AITool> {
  const insertData = {
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    category: tool.category ?? null,
    system_prompt: tool.systemPrompt,
    model: tool.model || 'claude-sonnet-4-20250514',
    max_tokens: tool.maxTokens || 1024,
    welcome_message: tool.welcomeMessage,
    suggested_prompts: tool.suggestedPrompts,
    is_active: tool.isActive ?? true,
  };

  const { data, error } = await supabase.from('ai_tools').insert(insertData).select().single();

  if (error) throw new Error(error.message);
  return mapAITool(data);
}

export async function updateAITool(toolId: string, updates: Partial<AIToolInput>): Promise<AITool> {
  const updateData: Record<string, unknown> = {};

  if (updates.slug !== undefined) updateData.slug = updates.slug;
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.systemPrompt !== undefined) updateData.system_prompt = updates.systemPrompt;
  if (updates.model !== undefined) updateData.model = updates.model;
  if (updates.maxTokens !== undefined) updateData.max_tokens = updates.maxTokens;
  if (updates.welcomeMessage !== undefined) updateData.welcome_message = updates.welcomeMessage;
  if (updates.suggestedPrompts !== undefined)
    updateData.suggested_prompts = updates.suggestedPrompts;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { data, error } = await supabase
    .from('ai_tools')
    .update(updateData)
    .eq('id', toolId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAITool(data);
}

export async function deleteAITool(toolId: string): Promise<void> {
  const { error } = await supabase.from('ai_tools').delete().eq('id', toolId);

  if (error) throw new Error(error.message);
}

export async function bulkUpdateAITools(
  toolIds: string[],
  updates: { model?: string; maxTokens?: number }
): Promise<AITool[]> {
  const updateData: Record<string, unknown> = {};

  if (updates.model !== undefined) updateData.model = updates.model;
  if (updates.maxTokens !== undefined) updateData.max_tokens = updates.maxTokens;

  // Guard against empty toolIds or empty update payload
  if (toolIds.length === 0 || Object.keys(updateData).length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('ai_tools')
    .update(updateData)
    .in('id', toolIds)
    .select();

  if (error) throw new Error(error.message);
  return (data || []).map(mapAITool);
}

export async function reorderAITools(toolIds: string[]): Promise<void> {
  // Update sort_order for each tool based on array position
  const updates = toolIds.map((id, index) => ({
    id,
    sort_order: index,
  }));

  // Supabase doesn't have bulk upsert, so we update each one
  for (const update of updates) {
    const { error } = await supabase
      .from('ai_tools')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id);

    if (error) throw new Error(error.message);
  }
}

// ============================================
// Chat Conversations
// ============================================

export async function fetchConversationsByStudent(studentId: string): Promise<ChatConversation[]> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapChatConversation);
}

export async function fetchConversationsByStudentAndTool(
  studentId: string,
  toolId: string
): Promise<ChatConversation[]> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('student_id', studentId)
    .eq('tool_id', toolId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapChatConversation);
}

export async function fetchConversationById(
  conversationId: string
): Promise<ChatConversation | null> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('id', conversationId)
    .single();

  if (error || !data) return null;
  return mapChatConversation(data);
}

export async function createConversation(input: ChatConversationInput): Promise<ChatConversation> {
  const insertData = {
    student_id: input.studentId,
    tool_id: input.toolId,
    title: input.title,
  };

  const { data, error } = await supabase
    .from('chat_conversations')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapChatConversation(data);
}

export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<ChatConversation> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .update({ title })
    .eq('id', conversationId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapChatConversation(data);
}

export async function updateConversation(
  conversationId: string,
  updates: Partial<{ title: string }>
): Promise<ChatConversation> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .update(updates)
    .eq('id', conversationId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapChatConversation(data);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const { error } = await supabase.from('chat_conversations').delete().eq('id', conversationId);

  if (error) throw new Error(error.message);
}

// ============================================
// Chat Messages
// ============================================

export async function fetchMessagesByConversation(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(MESSAGE_COLUMNS)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapChatMessage);
}

export async function createMessage(input: ChatMessageInput): Promise<ChatMessage> {
  const insertData = {
    conversation_id: input.conversationId,
    role: input.role,
    content: input.content,
    input_tokens: input.inputTokens,
    output_tokens: input.outputTokens,
  };

  const { data, error } = await supabase.from('chat_messages').insert(insertData).select().single();

  if (error) throw new Error(error.message);
  return mapChatMessage(data);
}

// ============================================
// Composite Queries
// ============================================

export async function fetchConversationWithMessages(
  conversationId: string
): Promise<ConversationWithMessages | null> {
  const conversation = await fetchConversationById(conversationId);
  if (!conversation) return null;

  const messages = await fetchMessagesByConversation(conversationId);
  return { ...conversation, messages };
}

// ============================================
// Tool Credits
// ============================================

export async function getCreditsForTool(studentId: string, toolId: string): Promise<number> {
  const { data } = await supabase
    .from('student_tool_credits')
    .select('credits_total, credits_used')
    .eq('student_id', studentId)
    .eq('tool_id', toolId);

  if (!data || data.length === 0) return 0;

  return data.reduce(
    (sum, row) => sum + ((row.credits_total as number) || 0) - ((row.credits_used as number) || 0),
    0
  );
}

export async function getOrCreateConversation(
  studentId: string,
  toolId: string
): Promise<ChatConversation> {
  // Try to find the most recent conversation for this student/tool
  const { data, error } = await supabase
    .from('chat_conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('student_id', studentId)
    .eq('tool_id', toolId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (data && !error) {
    return mapChatConversation(data);
  }

  // Create a new conversation if none exists
  return createConversation({ studentId, toolId });
}
