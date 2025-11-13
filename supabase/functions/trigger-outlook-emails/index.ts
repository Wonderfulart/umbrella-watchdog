import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const TriggerEmailSchema = z.object({
  email_type: z.enum(['email1', 'email2']),
  test_mode: z.boolean().optional().default(false),
});

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

    const payload = await req.json();
    const validationResult = TriggerEmailSchema.safeParse(payload);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input', 
          details: validationResult.error.issues 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email_type, test_mode } = validationResult.data;
    
    if (test_mode) {
      console.log('⚠️ TEST MODE ACTIVE - Email status flags will NOT be updated');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: config, error: configError } = await supabase
      .from('automation_config')
      .select('webhook_url')
      .single();

    if (configError || !config) {
      throw new Error('Webhook URL not configured');
    }

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
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error triggering emails:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
