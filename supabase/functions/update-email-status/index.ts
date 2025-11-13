import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateEmailStatusRequest {
  policy_id: string;
  email_type: 'email1' | 'email2';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Update email status request received');

    const payload: UpdateEmailStatusRequest = await req.json();
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const { policy_id, email_type } = payload;

    if (!policy_id || !email_type) {
      return new Response(
        JSON.stringify({ error: 'policy_id and email_type are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (email_type !== 'email1' && email_type !== 'email2') {
      return new Response(
        JSON.stringify({ error: 'email_type must be either "email1" or "email2"' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the appropriate email flag
    const updateData = email_type === 'email1' 
      ? { email1_sent: true, email1_sent_date: new Date().toISOString() }
      : { email2_sent: true, email2_sent_date: new Date().toISOString() };

    console.log(`Updating ${email_type} status for policy ${policy_id}`);

    const { data, error } = await supabase
      .from('policies')
      .update(updateData)
      .eq('id', policy_id)
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Database update failed', details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!data || data.length === 0) {
      console.error(`Policy not found: ${policy_id}`);
      return new Response(
        JSON.stringify({ error: 'Policy not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Successfully updated ${email_type} status for policy ${policy_id}`);

    // Log the email send to email_logs table
    const policy = data[0];
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        policy_id: policy_id,
        email_type: email_type,
        recipient_email: policy.client_email,
        status: 'sent',
      });

    if (logError) {
      console.error('Failed to log email send:', logError);
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${email_type} status updated successfully`,
        policy_id,
        updated_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
