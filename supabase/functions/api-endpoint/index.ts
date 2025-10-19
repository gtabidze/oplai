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

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

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
    if (!apiEndpoint.is_active && apiEndpoint.name !== 'Golden Datasets API') {
      return new Response(
        JSON.stringify({ error: 'API endpoint is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Endpoint active, fetching playbook data for user: ${apiEndpoint.user_id}`);

    // Determine which playbooks to fetch
    let playbooksQuery = supabase
      .from('playbooks')
      .select('*')
      .eq('user_id', apiEndpoint.user_id);

    // If not Golden Datasets API (which shows all), filter by selected playbooks
    const selected = Array.isArray(apiEndpoint.selected_playbooks) ? apiEndpoint.selected_playbooks : [];
    const validIds = selected.filter((v) => typeof v === 'string' && isUuid(v));
    if (apiEndpoint.name !== 'Golden Datasets API' && selected.length > 0) {
      if (validIds.length > 0) {
        playbooksQuery = playbooksQuery.in('id', validIds);
      } else {
        console.log('No valid UUIDs in selected_playbooks; returning all playbooks for this user');
      }
    }

    const { data: playbooks, error: playbooksError } = await playbooksQuery;

    if (playbooksError) {
      console.error('Error fetching playbooks:', playbooksError);
      return new Response(
        JSON.stringify({ error: 'Error fetching playbooks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${playbooks?.length || 0} playbooks`);

    // Build response based on configured data points
    const responseData = await Promise.all((playbooks || []).map(async (playbook) => {
      const data: Record<string, unknown> = {
        playbookId: playbook.id,
        playbookTitle: playbook.title,
      };
      
      if (apiEndpoint.data_points.playbookContent) {
        data.content = playbook.content;
      }
      
      // Fetch questions for this playbook if requested
      if (apiEndpoint.data_points.questions || apiEndpoint.data_points.answers) {
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('playbook_id', playbook.id);

        if (!questionsError && questions) {
          if (apiEndpoint.data_points.questions) {
            data.questions = questions.map(q => q.question);
          }

          // Fetch answers if requested
          if (apiEndpoint.data_points.answers || apiEndpoint.data_points.scores) {
            const questionIds = questions.map(q => q.id);
            if (questionIds.length > 0) {
              const { data: answers, error: answersError } = await supabase
                .from('answers')
                .select('*')
                .in('question_id', questionIds);

              if (!answersError && answers) {
                if (apiEndpoint.data_points.answers) {
                  data.answers = answers.map(a => ({
                    question: questions.find(q => q.id === a.question_id)?.question,
                    answer: a.answer,
                  }));
                }

                if (apiEndpoint.data_points.scores) {
                  data.scores = answers.reduce((acc, a) => {
                    if (a.score !== null) {
                      const question = questions.find(q => q.id === a.question_id)?.question;
                      if (question) {
                        acc[question] = a.score;
                      }
                    }
                    return acc;
                  }, {} as Record<string, number>);
                }
              }
            }
          }
        }
      }
      
      if (apiEndpoint.data_points.createdDate) {
        data.createdAt = playbook.created_at;
      }
      
      if (apiEndpoint.data_points.updatedDate) {
        data.updatedAt = playbook.updated_at;
      }

      return data;
    }));

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