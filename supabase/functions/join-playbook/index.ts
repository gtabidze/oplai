import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { token } = await req.json();

    if (!token) {
      throw new Error('Token is required');
    }

    console.log('Looking up share with token:', token);

    // Find the share link
    const { data: share, error: shareError } = await supabase
      .from('playbook_shares')
      .select('playbook_id, is_active, expires_at')
      .eq('token', token)
      .single();

    if (shareError || !share) {
      console.error('Share not found:', shareError);
      throw new Error('Invalid share link');
    }

    // Check if share is active
    if (!share.is_active) {
      throw new Error('Share link is no longer active');
    }

    // Check if expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      throw new Error('Share link has expired');
    }

    console.log('Valid share found for playbook:', share.playbook_id);

    // Check if user is already a collaborator
    const { data: existing } = await supabase
      .from('playbook_collaborators')
      .select('id')
      .eq('playbook_id', share.playbook_id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      console.log('User already a collaborator');
      return new Response(
        JSON.stringify({ success: true, playbookId: share.playbook_id, message: 'Already a collaborator' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add user as collaborator
    const { error: insertError } = await supabase
      .from('playbook_collaborators')
      .insert({
        playbook_id: share.playbook_id,
        user_id: user.id,
        role: 'editor'
      });

    if (insertError) {
      console.error('Error adding collaborator:', insertError);
      throw new Error('Failed to add collaborator');
    }

    console.log('Successfully added collaborator');

    return new Response(
      JSON.stringify({ success: true, playbookId: share.playbook_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in join-playbook:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});