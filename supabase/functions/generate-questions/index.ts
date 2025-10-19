import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentContent, customSystemPrompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating questions for document with length:', documentContent?.length);

    const defaultSystemPrompt = 'You are a helpful assistant that generates questions. Analyze the provided text and generate 8 questions that end users would ask about the facts, content, and subject matter presented in the text. Focus on the actual content, NOT meta-questions about the document itself. Return ONLY a JSON array of strings, nothing else.';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: customSystemPrompt || defaultSystemPrompt
          },
          {
            role: 'user',
            content: `Generate 8 questions that users would ask about the facts and content in this text:\n\n${documentContent}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');
    
    let content = data.choices[0].message.content;
    
    // Remove markdown code fences if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to parse as JSON array
    let questions;
    try {
      questions = JSON.parse(content);
      // Ensure it's an array and filter out invalid entries
      if (Array.isArray(questions)) {
        questions = questions.filter((q: any) => 
          typeof q === 'string' && 
          q.trim().length > 3 && 
          !q.match(/^[\[\]{}]$/) &&
          !q.startsWith('```')
        );
      }
    } catch {
      // If not JSON, split by newlines and clean up
      questions = content
        .split('\n')
        .filter((q: string) => {
          const trimmed = q.trim();
          return trimmed.length > 3 && 
                 !trimmed.match(/^[\[\]{}]$/) &&
                 !trimmed.startsWith('```');
        })
        .map((q: string) => q.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').replace(/^["']|["']$/g, '').trim())
        .slice(0, 8);
    }

    console.log('Generated questions count:', questions.length);

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-questions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
