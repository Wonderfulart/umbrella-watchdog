import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetupCronRequest {
  enabled: boolean;
  time?: string; // 24-hour format like "09:00"
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: SetupCronRequest = await req.json();
    const { enabled, time = '09:00' } = payload;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (enabled) {
      // Parse time to get hour and minute
      const [hour, minute] = time.split(':').map(Number);
      
      // Create cron expression for daily execution
      const cronExpression = `${minute} ${hour} * * *`;

      // Schedule the cron job using our database function
      const { error: cronError } = await supabase.rpc('enable_email_cron', {
        p_schedule: cronExpression,
        p_function_url: `${supabaseUrl}/functions/v1/run-policy-reminder`,
        p_anon_key: Deno.env.get('SUPABASE_ANON_KEY'),
      });

      if (cronError) throw cronError;

      return new Response(
        JSON.stringify({
          success: true,
          message: `Automation enabled - will run daily at ${time}`,
          enabled: true,
          schedule: time,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Disable cron job
      const { error: disableError } = await supabase.rpc('disable_email_cron');

      if (disableError) throw disableError;

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Automation disabled',
          enabled: false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Cron setup error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to configure automation',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
