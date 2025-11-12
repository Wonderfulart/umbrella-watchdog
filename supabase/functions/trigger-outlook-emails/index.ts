import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email_type, test_mode = false } = await req.json();
    console.log('Triggering emails for type:', email_type);
    console.log('Test mode:', test_mode);
    
    if (test_mode) {
      console.log('⚠️ TEST MODE ACTIVE - Email status flags will NOT be updated');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get webhook URL from config
    const { data: config, error: configError } = await supabase
      .from('automation_config')
      .select('webhook_url')
      .single();

    if (configError || !config) {
      throw new Error('Webhook URL not configured');
    }

    // Call get-policies-for-email function
    const { data: policiesData, error: policiesError } = await supabase.functions.invoke(
      'get-policies-for-email',
      {
        body: { email_type, test_mode },
      }
    );

    if (policiesError) {
      throw new Error(`Failed to fetch policies: ${policiesError.message}`);
    }

    const policies = policiesData?.policies || [];
    console.log(`Found ${policies.length} policies for ${email_type}`);

    if (policies.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          sent: 0,
          failed: 0,
          total: 0,
          message: 'No policies need emails at this time',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send to Make.com webhook
    const webhookResponse = await fetch(config.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        policies: policies.map((p: any) => ({
          ...p,
          email_type,
        })),
      }),
    });

    if (!webhookResponse.ok) {
      throw new Error(`Make.com webhook failed: ${webhookResponse.statusText}`);
    }

    // Make.com webhook returns "Accepted" as text, not JSON
    const responseText = await webhookResponse.text();
    console.log('Webhook response:', responseText);

    return new Response(
      JSON.stringify({
        success: true,
        sent: policies.length,
        failed: 0,
        total: policies.length,
        test_mode,
        message: test_mode 
          ? `✅ TEST MODE: Triggered ${policies.length} test emails via Make.com (status flags NOT updated)`
          : `Successfully triggered ${policies.length} emails via Make.com`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error triggering emails:', error);
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
