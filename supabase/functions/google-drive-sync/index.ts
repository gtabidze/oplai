import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  parents?: string[];
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_DRIVE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET')!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  return data.access_token;
}

async function listGoogleDriveFiles(accessToken: string): Promise<GoogleDriveFile[]> {
  const response = await fetch(
    'https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,mimeType,size,webViewLink,parents)',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch files from Google Drive');
  }

  const data = await response.json();
  return data.files || [];
}

async function getFileContent(fileId: string, accessToken: string): Promise<string> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch file content for ${fileId}`);
  }

  return await response.text();
}

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

    console.log('Starting Google Drive sync for user:', user.id);

    // Get user's Google Drive connection
    const { data: connection, error: connectionError } = await supabaseClient
      .from('data_sources')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google-drive')
      .single();

    if (connectionError || !connection) {
      throw new Error('Google Drive not connected');
    }

    let accessToken = connection.access_token;

    // Check if token needs refresh
    const tokenExpiresAt = new Date(connection.token_expires_at);
    if (tokenExpiresAt <= new Date()) {
      console.log('Token expired, refreshing...');
      accessToken = await refreshAccessToken(connection.refresh_token);
      
      // Update token in database
      const expiresAt = new Date(Date.now() + (3600 * 1000)); // 1 hour
      await supabaseClient
        .from('data_sources')
        .update({
          access_token: accessToken,
          token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);
    }

    // Fetch files from Google Drive
    console.log('Fetching files from Google Drive...');
    const files = await listGoogleDriveFiles(accessToken);
    console.log(`Found ${files.length} files`);

    // Filter for text-based files (documents, text files, etc.)
    const textFiles = files.filter(file => 
      file.mimeType.includes('text') || 
      file.mimeType.includes('document') ||
      file.mimeType === 'application/pdf'
    );

    console.log(`Processing ${textFiles.length} text-based files`);

    // Sync files to database
    const syncedFiles = [];
    for (const file of textFiles.slice(0, 50)) { // Limit to 50 files for now
      try {
        let content = '';
        
        // Only fetch content for small text files
        if (file.mimeType.includes('text/plain') && (!file.size || parseInt(file.size) < 1000000)) {
          content = await getFileContent(file.id, accessToken);
        }

        const { data: syncedFile, error: syncError } = await supabaseClient
          .from('synced_files')
          .upsert({
            data_source_id: connection.id,
            user_id: user.id,
            provider_file_id: file.id,
            file_name: file.name,
            file_type: file.mimeType,
            file_size: file.size ? parseInt(file.size) : null,
            file_path: file.parents?.join('/') || '',
            content: content,
            metadata: {
              webViewLink: file.webViewLink,
            },
            synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'data_source_id,provider_file_id'
          })
          .select()
          .single();

        if (!syncError && syncedFile) {
          syncedFiles.push(syncedFile);
        }
      } catch (fileError) {
        console.error(`Error syncing file ${file.name}:`, fileError);
      }
    }

    // Update last synced timestamp
    await supabaseClient
      .from('data_sources')
      .update({
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    console.log(`Sync complete: ${syncedFiles.length} files synced`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalFiles: files.length,
        syncedFiles: syncedFiles.length,
        files: syncedFiles 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in google-drive-sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
