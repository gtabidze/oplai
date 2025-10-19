import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { message, conversationHistory } = await req.json();

    console.log('Fetching user context for AI assistant...');

    // Fetch all playbooks
    const { data: playbooks, error: playbooksError } = await supabase
      .from('playbooks')
      .select('id, title, content, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (playbooksError) {
      console.error('Error fetching playbooks:', playbooksError);
      throw playbooksError;
    }

    // Fetch all questions with their answers
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        question,
        playbook_id,
        created_at,
        answers (
          id,
          answer,
          score,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      throw questionsError;
    }

    // Fetch all prompts with their versions
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select(`
        id,
        name,
        type,
        is_active,
        created_at,
        updated_at,
        prompt_versions (
          id,
          version_number,
          content,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (promptsError) {
      console.error('Error fetching prompts:', promptsError);
      throw promptsError;
    }

    // Build context about user's data
    const contextParts = [];

    if (playbooks && playbooks.length > 0) {
      contextParts.push(`\n# User's Playbooks (${playbooks.length} total):`);
      playbooks.forEach(pb => {
        const playbookQuestions = questions?.filter(q => q.playbook_id === pb.id) || [];
        contextParts.push(`\n## Playbook: "${pb.title}" (ID: ${pb.id})`);
        contextParts.push(`Created: ${new Date(pb.created_at).toLocaleString()}`);
        if (pb.content) {
          contextParts.push(`Content: ${pb.content}`);
        }
        contextParts.push(`Questions count: ${playbookQuestions.length}`);
        
        if (playbookQuestions.length > 0) {
          contextParts.push(`\nQuestions for this playbook:`);
          playbookQuestions.forEach(q => {
            contextParts.push(`  - Question: "${q.question}"`);
            const answers = Array.isArray(q.answers) ? q.answers : [];
            if (answers.length > 0) {
              answers.forEach(a => {
                contextParts.push(`    Answer: "${a.answer}"`);
                if (a.score !== null) {
                  contextParts.push(`    Score: ${a.score}`);
                }
              });
            } else {
              contextParts.push(`    (No answer provided yet)`);
            }
          });
        }
      });
    } else {
      contextParts.push('\nNo playbooks created yet.');
    }

    if (prompts && prompts.length > 0) {
      contextParts.push(`\n\n# System Prompts (${prompts.length} total):`);
      prompts.forEach(p => {
        const versions = Array.isArray(p.prompt_versions) ? p.prompt_versions : [];
        contextParts.push(`\n## Prompt: "${p.name}" (Type: ${p.type})`);
        contextParts.push(`Active: ${p.is_active ? 'Yes' : 'No'}`);
        contextParts.push(`Versions count: ${versions.length}`);
        
        if (versions.length > 0) {
          contextParts.push(`Latest versions:`);
          versions.slice(0, 3).forEach(v => {
            contextParts.push(`  - Version ${v.version_number}:`);
            contextParts.push(`    Content: ${v.content}`);
            contextParts.push(`    Created: ${new Date(v.created_at).toLocaleString()}`);
          });
        }
      });
    } else {
      contextParts.push('\n\nNo system prompts created yet.');
    }

    const systemContext = contextParts.join('\n');

    // Prepare messages for AI
    const messages = [
      {
        role: "system",
        content: `You are an AI assistant helping users understand and manage their playbooks, questions, answers, and system prompts. 

Here is the complete context about the user's data:
${systemContext}

Be helpful, concise, and accurate. When the user asks about their data, refer to the specific information provided above. If asked about something that doesn't exist in their data, let them know clearly.

You can help with:
- Summarizing playbooks and their contents
- Listing questions and their answers
- Showing answer scores
- Explaining system prompts and their versions
- Analyzing patterns in their data
- Providing insights and suggestions`
      },
      ...conversationHistory,
      {
        role: "user",
        content: message
      }
    ];

    console.log('Calling Lovable AI...');

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (aiResponse.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const assistantResponse = aiData.choices[0].message.content;

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ai-assistant-chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
