import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import {
  fetchAllAITools,
  fetchActiveAITools,
  fetchAIToolById,
  fetchAIToolBySlug,
  fetchConversationsByStudent,
  fetchConversationsByStudentAndTool,
  fetchMessagesByConversation,
  fetchConversationWithMessages,
} from '../services/chat-supabase';

// ============================================
// AI Tool Queries
// ============================================

export function useAITools() {
  return useQuery({
    queryKey: queryKeys.aiTools(),
    queryFn: fetchAllAITools,
  });
}

export function useActiveAITools() {
  return useQuery({
    queryKey: [...queryKeys.aiTools(), 'active'],
    queryFn: fetchActiveAITools,
  });
}

export function useAIToolById(toolId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.aiToolById(toolId || ''),
    queryFn: () => fetchAIToolById(toolId!),
    enabled: !!toolId,
  });
}

export function useAIToolBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.aiToolBySlug(slug || ''),
    queryFn: () => fetchAIToolBySlug(slug!),
    enabled: !!slug,
  });
}

// ============================================
// Conversation Queries
// ============================================

export function useConversations(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chatConversations(studentId || ''),
    queryFn: () => fetchConversationsByStudent(studentId!),
    enabled: !!studentId,
  });
}

export function useConversationsByTool(studentId: string | undefined, toolId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chatConversationsByTool(studentId || '', toolId || ''),
    queryFn: () => fetchConversationsByStudentAndTool(studentId!, toolId!),
    enabled: !!studentId && !!toolId,
  });
}

// ============================================
// Message Queries
// ============================================

export function useChatMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chatMessages(conversationId || ''),
    queryFn: () => fetchMessagesByConversation(conversationId!),
    enabled: !!conversationId,
  });
}

export function useConversationWithMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.chatMessages(conversationId || ''), 'full'],
    queryFn: () => fetchConversationWithMessages(conversationId!),
    enabled: !!conversationId,
  });
}
