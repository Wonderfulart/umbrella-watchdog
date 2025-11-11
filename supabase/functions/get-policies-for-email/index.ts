import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PolicyForEmail {
  id: string;
  customer_number: string;
  policy_number: string;
  client_first_name: string;
  company_name: string;
  client_email: string;
  agent_email: string;
  expiration_date: string;
  submission_link: string;
  email_type: 'email1' | 'email2';
  agent_first_name: string;
  agent_last_name: string;
  agent_company_logo_url: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching policies for email automation');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate dates for filtering
    const today = new Date();
    const email1Date = new Date(today);
    email1Date.setDate(email1Date.getDate() + 37);
    
    const email2Date = new Date(today);
    email2Date.setDate(email2Date.getDate() - 7);

    console.log('Today:', today.toISOString());
    console.log('Email 1 target date (T+37):', email1Date.toISOString());
    console.log('Email 2 cutoff date (T-7):', email2Date.toISOString());

    // Fetch policies needing Email 1 (T-37 days)
    const { data: email1Policies, error: email1Error } = await supabase
      .from('policies')
      .select('*')
      .eq('email1_sent', false)
      .eq('expiration_date', email1Date.toISOString().split('T')[0]);

    if (email1Error) {
      console.error('Error fetching email1 policies:', email1Error);
      throw email1Error;
    }

    // Fetch policies needing Email 2 (T+7 days after expiration, no submission)
    const { data: email2Policies, error: email2Error } = await supabase
      .from('policies')
      .select('*')
      .eq('email2_sent', false)
      .eq('jotform_submitted', false)
      .lte('expiration_date', email2Date.toISOString().split('T')[0]);

    if (email2Error) {
      console.error('Error fetching email2 policies:', email2Error);
      throw email2Error;
    }

    // Format policies for Make.com
    const policiesForEmail1: PolicyForEmail[] = (email1Policies || []).map(policy => ({
      id: policy.id,
      customer_number: policy.customer_number,
      policy_number: policy.policy_number,
      client_first_name: policy.client_first_name,
      company_name: policy.company_name,
      client_email: policy.client_email,
      agent_email: policy.agent_email,
      expiration_date: policy.expiration_date,
      submission_link: policy.submission_link,
      email_type: 'email1' as const,
      agent_first_name: policy.agent_first_name || '',
      agent_last_name: policy.agent_last_name || '',
      agent_company_logo_url: policy.agent_company_logo_url || '',
    }));

    const policiesForEmail2: PolicyForEmail[] = (email2Policies || []).map(policy => ({
      id: policy.id,
      customer_number: policy.customer_number,
      policy_number: policy.policy_number,
      client_first_name: policy.client_first_name,
      company_name: policy.company_name,
      client_email: policy.client_email,
      agent_email: policy.agent_email,
      expiration_date: policy.expiration_date,
      submission_link: policy.submission_link,
      email_type: 'email2' as const,
      agent_first_name: policy.agent_first_name || '',
      agent_last_name: policy.agent_last_name || '',
      agent_company_logo_url: policy.agent_company_logo_url || '',
    }));

    const allPolicies = [...policiesForEmail1, ...policiesForEmail2];

    console.log(`Found ${policiesForEmail1.length} policies for Email 1`);
    console.log(`Found ${policiesForEmail2.length} policies for Email 2`);
    console.log(`Total policies to process: ${allPolicies.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        policies: allPolicies,
        summary: {
          email1_count: policiesForEmail1.length,
          email2_count: policiesForEmail2.length,
          total_count: allPolicies.length,
        },
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
