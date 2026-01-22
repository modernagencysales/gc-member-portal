/* eslint-disable no-undef */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  toolId?: string;
  toolSlug?: string;
  conversationId?: string;
  message: string;
  studentId: string;
}

interface AITool {
  id: string;
  system_prompt: string;
  model: string;
  max_tokens: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { toolId, toolSlug, conversationId, message, studentId }: ChatRequest = await req.json();

    if (!message || !studentId) {
      throw new Error('Missing required fields: message, studentId');
    }

    if (!toolId && !toolSlug && !conversationId) {
      throw new Error('Must provide toolId, toolSlug, or conversationId');
    }

    // 1. Load AI Tool config
    let tool: AITool | null = null;
    let actualConversationId = conversationId;

    if (conversationId) {
      // Get tool from conversation
      const { data: conv } = await supabase
        .from('chat_conversations')
        .select('tool_id')
        .eq('id', conversationId)
        .single();

      if (conv) {
        const { data: t } = await supabase
          .from('ai_tools')
          .select('id, system_prompt, model, max_tokens')
          .eq('id', conv.tool_id)
          .single();
        tool = t;
      }
    } else if (toolId) {
      const { data: t } = await supabase
        .from('ai_tools')
        .select('id, system_prompt, model, max_tokens')
        .eq('id', toolId)
        .single();
      tool = t;
    } else if (toolSlug) {
      const { data: t } = await supabase
        .from('ai_tools')
        .select('id, system_prompt, model, max_tokens')
        .eq('slug', toolSlug)
        .single();
      tool = t;
    }

    if (!tool) {
      throw new Error('AI Tool not found');
    }

    // 2. Get or create conversation
    if (!actualConversationId) {
      // Check for existing conversation
      const { data: existingConv } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('student_id', studentId)
        .eq('tool_id', tool.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (existingConv) {
        actualConversationId = existingConv.id;
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('chat_conversations')
          .insert({
            student_id: studentId,
            tool_id: tool.id,
            title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          })
          .select('id')
          .single();

        if (convError) throw convError;
        actualConversationId = newConv.id;
      }
    }

    // 3. Fetch chat history
    const { data: historyData } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', actualConversationId)
      .order('created_at', { ascending: true });

    const history: ChatMessage[] = (historyData || []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // 4. Save user message
    const { error: userMsgError } = await supabase.from('chat_messages').insert({
      conversation_id: actualConversationId,
      role: 'user',
      content: message,
    });

    if (userMsgError) throw userMsgError;

    // Update conversation timestamp
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', actualConversationId);

    // 5. Call Claude API with streaming
    const messages = [...history, { role: 'user' as const, content: message }];

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: tool.model || 'claude-sonnet-4-20250514',
        max_tokens: tool.max_tokens || 1024,
        system: tool.system_prompt,
        messages,
        stream: true,
      }),
    });

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text();
      throw new Error(`Claude API error: ${error}`);
    }

    // Create a TransformStream for processing the response
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let fullResponse = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'content_block_delta') {
                const delta = parsed.delta?.text || '';
                fullResponse += delta;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: delta })}\n\n`)
                );
              } else if (parsed.type === 'message_start') {
                inputTokens = parsed.message?.usage?.input_tokens || 0;
              } else if (parsed.type === 'message_delta') {
                outputTokens = parsed.usage?.output_tokens || 0;
              } else if (parsed.type === 'message_stop') {
                // Save the assistant message to the database
                await supabase.from('chat_messages').insert({
                  conversation_id: actualConversationId,
                  role: 'assistant',
                  content: fullResponse,
                  input_tokens: inputTokens,
                  output_tokens: outputTokens,
                });

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'done',
                      conversationId: actualConversationId,
                      usage: { inputTokens, outputTokens },
                    })}\n\n`
                  )
                );
              } else if (parsed.type === 'error') {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'error', error: parsed.error?.message })}\n\n`
                  )
                );
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      },
    });

    // Pipe the Claude response through our transform
    const responseBody = claudeResponse.body!.pipeThrough(transformStream);

    return new Response(responseBody, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
