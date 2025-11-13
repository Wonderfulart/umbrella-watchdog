import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const MAKE_API_TOKEN = Deno.env.get('MAKE_API');
const MAKE_TEAM_ID = '262894';
const MAKE_BASE_URL = 'https://us2.make.com/api/v2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!MAKE_API_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    console.log('Fetching Make.com connections...');
    
    const connectionsResponse = await fetch(
      `${MAKE_BASE_URL}/connections?teamId=${MAKE_TEAM_ID}`,
      {
        headers: {
          'Authorization': `Token ${MAKE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!connectionsResponse.ok) {
      throw new Error(`Make.com API error: ${connectionsResponse.statusText}`);
    }

    const connectionsData = await connectionsResponse.json();
    console.log('Connections response:', JSON.stringify(connectionsData, null, 2));

    const outlookConnection = connectionsData.connections?.find(
      (conn: any) => conn.accountName?.toLowerCase().includes('outlook') ||
                     conn.accountLabel?.toLowerCase().includes('outlook')
    );

    if (!outlookConnection) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No Outlook connection found in Make.com. Please set up an Outlook connection first.',
          available_connections: connectionsData.connections?.map((conn: any) => ({
            id: conn.id,
            name: conn.accountName || conn.accountLabel,
            type: conn.type,
          })) || [],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Found Outlook connection:', outlookConnection.id);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const webhookUrl = Deno.env.get('MAKE_WEBHOOK_URL') || 'https://hook.us2.make.com/9c7md7mxdsg264527b3gv78u3xvssvgc';
    
    const { error: configError } = await supabase
      .from('automation_config')
      .upsert({
        webhook_url: webhookUrl,
        make_connection_id: outlookConnection.id.toString(),
      });

    if (configError) {
      throw new Error(`Failed to update config: ${configError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        webhook_url: webhookUrl,
        outlook_connection_id: outlookConnection.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in setup-make-scenario:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
