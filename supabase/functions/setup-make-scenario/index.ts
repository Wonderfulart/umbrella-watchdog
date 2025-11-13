import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const MAKE_API_TOKEN = Deno.env.get('MAKE_API');
const MAKE_TEAM_ID = '1471864';
const MAKE_BASE_URL = 'https://us2.make.com/api/v2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_URL = 'https://hook.us2.make.com/9c7md7mxdsg264527b3gv78u3xvssvgc';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting simplified Make.com setup...');

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Verify Outlook connection exists in Make.com
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
      throw new Error(`Failed to fetch connections: ${connectionsResponse.statusText}`);
    }

    const connections = await connectionsResponse.json();
    console.log('Checking for Outlook connection...');

    const microsoftConnections = connections.connections?.filter(
      (conn: any) => 
        conn.name?.toLowerCase().includes('outlook') || 
        conn.name?.toLowerCase().includes('office') ||
        conn.name?.toLowerCase().includes('microsoft') ||
        conn.accountName?.toLowerCase().includes('outlook') ||
        conn.accountName?.toLowerCase().includes('azure') ||
        conn.accountLabel?.toLowerCase().includes('microsoft')
    );

    const outlookConnection = microsoftConnections?.find(
      (conn: any) => conn.metadata?.email === 'policyreminder@prlinsurance.com'
    ) || microsoftConnections?.[0];

    if (!outlookConnection) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No Microsoft/Outlook connection found. Please connect your Outlook account in Make.com first.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Found Outlook connection:', outlookConnection);

    // Step 2: Save webhook URL and connection ID to database
    const { data: config, error: configError } = await supabase
      .from('automation_config')
      .select('*')
      .single();

    if (config) {
      await supabase
        .from('automation_config')
        .update({
          webhook_url: WEBHOOK_URL,
          make_connection_id: outlookConnection.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id);
    } else {
      await supabase
        .from('automation_config')
        .insert({
          webhook_url: WEBHOOK_URL,
          make_connection_id: outlookConnection.id,
        });
    }

    console.log('Configuration saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook configured. Ready to send emails.',
        webhook_url: WEBHOOK_URL,
        connection_id: outlookConnection.id,
        connection_email: outlookConnection.metadata?.email,
        outlookConnectionName: outlookConnection.metadata?.email || 'Microsoft Account',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error setting up Make.com:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
