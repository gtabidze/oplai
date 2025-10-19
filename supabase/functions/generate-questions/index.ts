import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callLLM(provider: string, systemPrompt: string, userPrompt: string) {
  console.log('Calling LLM with provider:', provider);
  
  if (provider === 'openai') {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } 
  else if (provider === 'anthropic') {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } 
  else {
    // Default to Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentContent, customSystemPrompt, llmProvider } = await req.json();
    const provider = llmProvider || 'lovable';

    // Extract text from HTML
    const textContent = documentContent
      .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
      .replace(/&nbsp;/g, ' ')    // Replace &nbsp; with space
      .replace(/\s+/g, ' ')       // Collapse multiple spaces
      .trim();

    console.log('Generating questions for document with length:', textContent?.length, 'using provider:', provider);

    if (!textContent || textContent.length < 10) {
      return new Response(
        JSON.stringify({ 
          error: 'Please add content to your playbook before generating questions. The knowledge base is empty.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const defaultSystemPrompt = 'You are a helpful assistant that generates questions. Analyze the provided text and generate 8 questions that end users would ask about the facts, content, and subject matter presented in the text. Focus on the actual content, NOT meta-questions about the document itself. Return ONLY a JSON array of strings, nothing else.';

    const content = await callLLM(
      provider,
      customSystemPrompt || defaultSystemPrompt,
      `Generate 8 questions that users would ask about the facts and content in this text:\n\n${textContent}`
    );

    console.log('AI response received');
    
    let cleanedContent = content;
    
    // Remove markdown code fences if present
    cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Try to parse as JSON array
    let questions;
    try {
      questions = JSON.parse(cleanedContent);
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
      questions = cleanedContent
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
