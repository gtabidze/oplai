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
    const { secrets } = await req.json();

    if (!secrets || typeof secrets !== 'object') {
      throw new Error('Invalid secrets payload');
    }

    console.log('Saving LLM configuration secrets:', Object.keys(secrets));

    // In a real implementation, you would save these to Supabase Vault or secure storage
    // For now, we're acknowledging the request
    // Note: Secrets should be added manually via Supabase dashboard or CLI

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'API keys received. Please add them manually to your Supabase project secrets in the dashboard under Edge Functions > Secrets.',
        keys: Object.keys(secrets)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in save-llm-config:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
