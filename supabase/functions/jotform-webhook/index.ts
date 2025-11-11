import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JotFormPayload {
  submissionID?: string;
  formID?: string;
  rawRequest?: {
    policyNumber?: string;
    typeA?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('JotForm webhook received');

    // Parse the incoming request
    const payload: JotFormPayload = await req.json();
    console.log('Payload received:', JSON.stringify(payload, null, 2));

    // Extract policy number from the payload
    const policyNumber = payload.rawRequest?.policyNumber;

    if (!policyNumber) {
      console.error('Missing policy number in payload');
      return new Response(
        JSON.stringify({ error: 'Policy number is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing submission for policy: ${policyNumber}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update the policy to mark jotform as submitted
    const { data, error } = await supabase
      .from('policies')
      .update({ jotform_submitted: true })
      .eq('policy_number', policyNumber)
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Database update failed', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!data || data.length === 0) {
      console.error(`Policy not found: ${policyNumber}`);
      return new Response(
        JSON.stringify({ error: 'Policy not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Successfully updated policy ${policyNumber}`);
    console.log('Updated data:', JSON.stringify(data, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Policy updated successfully',
        policyNumber,
        submissionID: payload.submissionID
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
