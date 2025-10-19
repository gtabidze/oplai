import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { code, redirect_uri } = await req.json();

    if (!code) {
      throw new Error('Authorization code is required');
    }

    console.log('Exchanging code for token...');

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: Deno.env.get('GOOGLE_DRIVE_CLIENT_ID')!,
        client_secret: Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET')!,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange error:', errorText);
      throw new Error(`Failed to exchange code: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();

    // Calculate token expiration time
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Store connection in database
    const { data: connection, error: dbError } = await supabaseClient
      .from('data_sources')
      .upsert({
        user_id: user.id,
        provider: 'google-drive',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        provider_user_id: userInfo.id,
        provider_user_email: userInfo.email,
        metadata: {
          name: userInfo.name,
          picture: userInfo.picture,
        },
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Connection saved successfully');

    return new Response(
      JSON.stringify({ success: true, connection }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in google-drive-oauth:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
