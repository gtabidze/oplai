import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface APIEndpoint {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  selected_playbooks: string[];
  data_points: {
    playbookContent: boolean;
    questions: boolean;
    answers: boolean;
    scores: boolean;
    createdDate: boolean;
    updatedDate: boolean;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract endpoint ID from URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const endpointId = pathParts[pathParts.length - 1];

    if (!endpointId) {
      return new Response(
        JSON.stringify({ error: 'Endpoint ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching API endpoint: ${endpointId}`);

    // Fetch the API endpoint configuration
    const { data: endpoint, error: endpointError } = await supabase
      .from('api_endpoints')
      .select('*')
      .eq('id', endpointId)
      .single();

    if (endpointError || !endpoint) {
      console.error('Endpoint not found:', endpointError);
      return new Response(
        JSON.stringify({ error: 'API endpoint not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiEndpoint = endpoint as APIEndpoint;

    // Check if endpoint is active
    if (!apiEndpoint.is_active && apiEndpoint.id !== 'golden-datasets-api') {
      return new Response(
        JSON.stringify({ error: 'API endpoint is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Endpoint active, fetching playbook data for user: ${apiEndpoint.user_id}`);

    // Fetch synced files for this user
    let filesQuery = supabase
      .from('synced_files')
      .select('*')
      .eq('user_id', apiEndpoint.user_id);

    // If not golden datasets (which shows all), filter by selected playbooks
    // Note: Since playbooks are stored in localStorage, we'll return all files
    // and let the client filter if needed. Alternatively, you could store playbook
    // associations in the database.
    
    const { data: files, error: filesError } = await filesQuery;

    if (filesError) {
      console.error('Error fetching files:', filesError);
      return new Response(
        JSON.stringify({ error: 'Error fetching data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${files?.length || 0} files`);

    // Build response based on configured data points
    const responseData = files?.map((file) => {
      const data: Record<string, unknown> = {};
      
      if (apiEndpoint.data_points.playbookContent) {
        data.content = file.content;
        data.fileName = file.file_name;
      }
      
      // Note: Questions, answers, and scores would need to be stored in separate tables
      // For now, we'll include placeholders
      if (apiEndpoint.data_points.questions) {
        data.questions = [];
      }
      
      if (apiEndpoint.data_points.answers) {
        data.answers = [];
      }
      
      if (apiEndpoint.data_points.scores) {
        data.scores = {};
      }
      
      if (apiEndpoint.data_points.createdDate) {
        data.createdAt = file.created_at;
      }
      
      if (apiEndpoint.data_points.updatedDate) {
        data.updatedAt = file.updated_at;
      }

      return data;
    }) || [];

    console.log(`Returning ${responseData.length} records`);

    return new Response(
      JSON.stringify({
        success: true,
        endpoint: {
          id: apiEndpoint.id,
          name: apiEndpoint.name,
        },
        data: responseData,
        total: responseData.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in api-endpoint function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});