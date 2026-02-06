/* eslint-disable no-undef */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://modernagencysales.com',
  'https://www.modernagencysales.com',
  'http://localhost:3000',
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true;
  return false;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

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
  const corsHeaders = getCorsHeaders(req);

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
      const { data: conv, error: convError } = await supabase
        .from('chat_conversations')
        .select('tool_id')
        .eq('id', conversationId)
        .maybeSingle();

      if (convError) {
        console.error('Failed to fetch conversation:', convError);
        throw new Error('Failed to fetch conversation');
      }

      if (conv) {
        const { data: t, error: toolError } = await supabase
          .from('ai_tools')
          .select('id, system_prompt, model, max_tokens')
          .eq('id', conv.tool_id)
          .maybeSingle();
        if (toolError) {
          console.error('Failed to fetch tool:', toolError);
          throw new Error('Failed to fetch AI tool');
        }
        tool = t;
      }
    } else if (toolId) {
      const { data: t, error: toolError } = await supabase
        .from('ai_tools')
        .select('id, system_prompt, model, max_tokens')
        .eq('id', toolId)
        .maybeSingle();
      if (toolError) {
        console.error('Failed to fetch tool by ID:', toolError);
        throw new Error('Failed to fetch AI tool');
      }
      tool = t;
    } else if (toolSlug) {
      const { data: t, error: toolError } = await supabase
        .from('ai_tools')
        .select('id, system_prompt, model, max_tokens')
        .eq('slug', toolSlug)
        .maybeSingle();
      if (toolError) {
        console.error('Failed to fetch tool by slug:', toolError);
        throw new Error('Failed to fetch AI tool');
      }
      tool = t;
    }

    if (!tool) {
      throw new Error('AI Tool not found');
    }

    // 2. Get or create conversation
    if (!actualConversationId) {
      // Check for existing conversation
      const { data: existingConvs, error: existingConvError } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('student_id', studentId)
        .eq('tool_id', tool.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (existingConvError) {
        console.error('Failed to check existing conversations:', existingConvError);
        throw new Error('Failed to check existing conversations');
      }

      if (existingConvs && existingConvs.length > 0) {
        actualConversationId = existingConvs[0].id;
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

    // 5. Build final system prompt (with optional Blueprint context)
    let finalSystemPrompt = tool.system_prompt;

    try {
      // Look up the student's email from bootcamp_students
      const { data: student, error: studentError } = await supabase
        .from('bootcamp_students')
        .select('email')
        .eq('id', studentId)
        .maybeSingle();

      if (studentError) {
        console.error('Failed to fetch student for Blueprint context:', studentError);
      }

      if (student?.email) {
        // Query prospects table for a matching email (case-insensitive) with status='complete'
        const { data: prospect, error: prospectError } = await supabase
          .from('prospects')
          .select(
            'full_name, authority_score, score_profile_optimization, score_content_presence, score_outbound_systems, score_inbound_infrastructure, score_social_proof, whats_working_1, whats_working_2, whats_working_3, buyer_persona, strategic_gap, strategic_opportunity, bottom_line, current_headline, recommended_headline, voice_style_guide, knowledge_base'
          )
          .ilike('email', student.email)
          .eq('status', 'complete')
          .maybeSingle();

        if (prospectError) {
          console.error('Failed to fetch prospect for Blueprint context:', prospectError);
        }

        if (prospect) {
          const lines: string[] = [];

          lines.push('=== STUDENT BLUEPRINT CONTEXT ===');
          lines.push(
            'This student has completed a LinkedIn Authority Blueprint analysis. Use this context to personalize your responses.'
          );

          if (prospect.full_name) {
            lines.push(`\nName: ${prospect.full_name}`);
          }

          if (prospect.authority_score != null) {
            lines.push(`Authority Score: ${prospect.authority_score}/100`);
          }

          // Sub-scores
          const subScores: string[] = [];
          if (prospect.score_profile_optimization != null) {
            subScores.push(`- Profile Optimization: ${prospect.score_profile_optimization}/10`);
          }
          if (prospect.score_content_presence != null) {
            subScores.push(`- Content Presence: ${prospect.score_content_presence}/10`);
          }
          if (prospect.score_outbound_systems != null) {
            subScores.push(`- Outbound Systems: ${prospect.score_outbound_systems}/10`);
          }
          if (prospect.score_inbound_infrastructure != null) {
            subScores.push(`- Inbound Infrastructure: ${prospect.score_inbound_infrastructure}/10`);
          }
          if (prospect.score_social_proof != null) {
            subScores.push(`- Social Proof: ${prospect.score_social_proof}/10`);
          }
          if (subScores.length > 0) {
            lines.push(...subScores);
          }

          // Strengths
          const strengths: string[] = [];
          if (prospect.whats_working_1) strengths.push(`- ${prospect.whats_working_1}`);
          if (prospect.whats_working_2) strengths.push(`- ${prospect.whats_working_2}`);
          if (prospect.whats_working_3) strengths.push(`- ${prospect.whats_working_3}`);
          if (strengths.length > 0) {
            lines.push('', 'STRENGTHS:');
            lines.push(...strengths);
          }

          // Strategic Analysis
          const strategic: string[] = [];
          if (prospect.buyer_persona) strategic.push(`Buyer Persona: ${prospect.buyer_persona}`);
          if (prospect.strategic_gap) strategic.push(`Strategic Gap: ${prospect.strategic_gap}`);
          if (prospect.strategic_opportunity)
            strategic.push(`Strategic Opportunity: ${prospect.strategic_opportunity}`);
          if (prospect.bottom_line) strategic.push(`Bottom Line: ${prospect.bottom_line}`);
          if (strategic.length > 0) {
            lines.push('', 'STRATEGIC ANALYSIS:');
            lines.push(...strategic);
          }

          // Profile
          const profile: string[] = [];
          if (prospect.current_headline)
            profile.push(`Current Headline: ${prospect.current_headline}`);
          if (prospect.recommended_headline)
            profile.push(`Recommended Headline: ${prospect.recommended_headline}`);
          if (prospect.voice_style_guide)
            profile.push(`Voice Style: ${prospect.voice_style_guide}`);
          if (profile.length > 0) {
            lines.push('', 'PROFILE:');
            lines.push(...profile);
          }

          // Knowledge Base (deep insights about their business, ICP, expertise)
          if (prospect.knowledge_base) {
            lines.push('', 'KNOWLEDGE BASE:');
            lines.push(prospect.knowledge_base);
          }

          lines.push('=== END BLUEPRINT CONTEXT ===');

          const blueprintContext = lines.join('\n');
          finalSystemPrompt = blueprintContext + '\n\n' + tool.system_prompt;
          console.log('Blueprint context injected for student:', studentId);
        } else {
          console.log('No Blueprint context found for student:', studentId);
        }
      } else {
        console.log('No email found for student:', studentId, '- skipping Blueprint lookup');
      }
    } catch (blueprintError) {
      console.error(
        'Blueprint context lookup failed (proceeding without context):',
        blueprintError
      );
      // finalSystemPrompt remains tool.system_prompt — chat continues without Blueprint context
    }

    // TAM Builder context injection
    if (toolSlug === 'tam-builder' || tool?.id) {
      // First check if this is the TAM Builder tool
      let isTamBuilder = false;
      if (toolSlug === 'tam-builder') {
        isTamBuilder = true;
      } else {
        // Check if the tool slug is 'tam-builder' by querying
        const { data: toolData, error: toolCheckError } = await supabase
          .from('ai_tools')
          .select('slug')
          .eq('id', tool.id)
          .maybeSingle();

        if (!toolCheckError && toolData?.slug === 'tam-builder') {
          isTamBuilder = true;
        }
      }

      if (isTamBuilder) {
        try {
          const { data: tamProject } = await supabase
            .from('tam_projects')
            .select('*')
            .eq('user_id', studentId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (tamProject) {
            const { data: jobs } = await supabase
              .from('tam_job_queue')
              .select('*')
              .eq('project_id', tamProject.id)
              .order('created_at', { ascending: true });

            const { count: totalCompanies } = await supabase
              .from('tam_companies')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', tamProject.id);

            const { count: qualifiedCompanies } = await supabase
              .from('tam_companies')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', tamProject.id)
              .eq('qualification_status', 'qualified');

            const { count: totalContacts } = await supabase
              .from('tam_contacts')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', tamProject.id);

            const tamContext = JSON.stringify(
              {
                project: {
                  id: tamProject.id,
                  name: tamProject.name,
                  status: tamProject.status,
                  icpProfile: tamProject.icp_profile,
                  sourcingStrategy: tamProject.sourcing_strategy,
                },
                jobs: jobs || [],
                stats: { totalCompanies, qualifiedCompanies, totalContacts },
              },
              null,
              2
            );

            finalSystemPrompt = finalSystemPrompt.replace('{icp_context}', tamContext);
            console.log('TAM Builder context injected for student:', studentId);
          } else {
            finalSystemPrompt = finalSystemPrompt.replace(
              '{icp_context}',
              'No TAM project found for this user.'
            );
            console.log('No TAM project found for student:', studentId);
          }
        } catch (tamError) {
          console.error('TAM context lookup failed (proceeding without context):', tamError);
          // Replace placeholder with error message
          finalSystemPrompt = finalSystemPrompt.replace(
            '{icp_context}',
            'TAM context unavailable due to error.'
          );
        }
      }
    }

    // 6. Credit check for Lead Magnet users
    let creditsRemaining: number | null = null;

    const { data: studentRecord } = await supabase
      .from('bootcamp_students')
      .select('access_level, subscription_status')
      .eq('id', studentId)
      .maybeSingle();

    const accessLevel = studentRecord?.access_level || 'Full Access';
    const subscriptionActive = studentRecord?.subscription_status === 'active';

    // Funnel Access expiry check
    if (accessLevel === 'Funnel Access') {
      const { data: funnelStudent } = await supabase
        .from('bootcamp_students')
        .select('access_expires_at')
        .eq('id', studentId)
        .maybeSingle();

      if (funnelStudent?.access_expires_at) {
        const expiresAt = new Date(funnelStudent.access_expires_at);
        if (expiresAt.getTime() < Date.now()) {
          return new Response(
            JSON.stringify({
              error: 'Your access has expired',
              code: 'ACCESS_EXPIRED',
            }),
            {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }

    if (accessLevel === 'Lead Magnet' && !subscriptionActive) {
      const { data: creditResult, error: creditError } = await supabase.rpc(
        'decrement_tool_credit',
        { p_student_id: studentId, p_tool_id: tool.id }
      );

      if (creditError) {
        console.error('Credit check failed:', creditError);
        throw new Error('Credit check failed');
      }

      if (creditResult === -1) {
        return new Response(
          JSON.stringify({
            error: 'No credits remaining',
            code: 'CREDITS_EXHAUSTED',
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      creditsRemaining = creditResult as number;
    }

    // 7. Call Claude API with streaming
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
        system: finalSystemPrompt,
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

                const donePayload: Record<string, unknown> = {
                  type: 'done',
                  conversationId: actualConversationId,
                  usage: { inputTokens, outputTokens },
                };
                if (creditsRemaining !== null) {
                  donePayload.creditsRemaining = creditsRemaining;
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(donePayload)}\n\n`));
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
