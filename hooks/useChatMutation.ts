import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import {
  createAITool,
  updateAITool,
  deleteAITool,
  bulkUpdateAITools,
  createConversation,
  updateConversationTitle,
  deleteConversation,
  createMessage,
} from '../services/chat-supabase';
import { AIToolInput, ChatConversationInput, ChatMessageInput } from '../types/chat-types';

// ============================================
// AI Tool Mutations
// ============================================

export function useCreateAIToolMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tool: AIToolInput) => createAITool(tool),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiTools() });
    },
  });
}

export function useUpdateAIToolMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ toolId, updates }: { toolId: string; updates: Partial<AIToolInput> }) =>
      updateAITool(toolId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiTools() });
      queryClient.invalidateQueries({ queryKey: queryKeys.aiToolById(variables.toolId) });
    },
  });
}

export function useDeleteAIToolMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (toolId: string) => deleteAITool(toolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiTools() });
    },
  });
}

export function useBulkUpdateAIToolsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      toolIds,
      updates,
    }: {
      toolIds: string[];
      updates: { model?: string; maxTokens?: number };
    }) => bulkUpdateAITools(toolIds, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiTools() });
    },
  });
}

// ============================================
// Conversation Mutations
// ============================================

export function useCreateConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ChatConversationInput) => createConversation(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatConversations(variables.studentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatConversationsByTool(variables.studentId, variables.toolId),
      });
    },
  });
}

export function useUpdateConversationTitleMutation() {
  return useMutation({
    mutationFn: ({ conversationId, title }: { conversationId: string; title: string }) =>
      updateConversationTitle(conversationId, title),
  });
}

export function useDeleteConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      studentId: _studentId,
    }: {
      conversationId: string;
      studentId: string;
    }) => deleteConversation(conversationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatConversations(variables.studentId),
      });
    },
  });
}

// ============================================
// Message Mutations
// ============================================

export function useCreateMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ChatMessageInput) => createMessage(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatMessages(variables.conversationId),
      });
    },
  });
}
