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
    const { test_mode = false, email_type } = await req.json();
    
    console.log('Fetching policies for email automation');
    console.log('Test mode:', test_mode);
    console.log('Email type:', email_type);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let email1Policies = [];
    let email2Policies = [];

    if (test_mode) {
      console.log('⚠️ TEST MODE ACTIVE - Using sample test data (1 policy only)');
      
      // Create sample test policy with all required fields
      const samplePolicy = {
        id: 'test-policy-' + Date.now(),
        customer_number: 'TEST-12345',
        policy_number: 'POL-TEST-001',
        client_first_name: 'Test Client',
        company_name: 'Test Insurance Co.',
        client_email: 'test@example.com',
        agent_email: 'agent@test.com',
        agent_first_name: 'Test',
        agent_last_name: 'Agent',
        agent_company_logo_url: 'https://via.placeholder.com/150',
        expiration_date: new Date().toISOString().split('T')[0],
        submission_link: 'https://form.jotform.com/test',
        email1_sent: false,
        email1_sent_date: null,
        email2_sent: false,
        email2_sent_date: null,
        jotform_submitted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Return only 1 sample policy based on email_type
      if (!email_type || email_type === 'email1') {
        email1Policies = [samplePolicy];
        console.log('✅ Test mode: Using 1 sample policy for Email 1');
      }

      if (!email_type || email_type === 'email2') {
        email2Policies = [{ ...samplePolicy, id: 'test-policy-email2-' + Date.now() }];
        console.log('✅ Test mode: Using 1 sample policy for Email 2');
      }
    } else {
      // Normal mode: use date filtering
      const today = new Date();
      const email1Date = new Date(today);
      email1Date.setDate(email1Date.getDate() + 37);
      
      const email2Date = new Date(today);
      email2Date.setDate(email2Date.getDate() - 7);

      console.log('Today:', today.toISOString());
      console.log('Email 1 target date (T+37):', email1Date.toISOString());
      console.log('Email 2 cutoff date (T-7):', email2Date.toISOString());

      // Fetch policies needing Email 1 (T-37 days)
      const { data: email1Data, error: email1Error } = await supabase
        .from('policies')
        .select('*')
        .eq('email1_sent', false)
        .eq('expiration_date', email1Date.toISOString().split('T')[0]);

      if (email1Error) {
        console.error('Error fetching email1 policies:', email1Error);
        throw email1Error;
      }
      email1Policies = email1Data || [];

      // Fetch policies needing Email 2 (T+7 days after expiration, no submission)
      const { data: email2Data, error: email2Error } = await supabase
        .from('policies')
        .select('*')
        .eq('email2_sent', false)
        .eq('jotform_submitted', false)
        .lte('expiration_date', email2Date.toISOString().split('T')[0]);

      if (email2Error) {
        console.error('Error fetching email2 policies:', email2Error);
        throw email2Error;
      }
      email2Policies = email2Data || [];
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
      agent_first_name: policy.agent_first_name,
      agent_last_name: policy.agent_last_name,
      agent_company_logo_url: policy.agent_company_logo_url,
      expiration_date: policy.expiration_date,
      submission_link: policy.submission_link,
      email_type: 'email1',
    }));

    const policiesForEmail2: PolicyForEmail[] = (email2Policies || []).map(policy => ({
      id: policy.id,
      customer_number: policy.customer_number,
      policy_number: policy.policy_number,
      client_first_name: policy.client_first_name,
      company_name: policy.company_name,
      client_email: policy.client_email,
      agent_email: policy.agent_email,
      agent_first_name: policy.agent_first_name,
      agent_last_name: policy.agent_last_name,
      agent_company_logo_url: policy.agent_company_logo_url,
      expiration_date: policy.expiration_date,
      submission_link: policy.submission_link,
      email_type: 'email2',
    }));

    console.log(`Found ${policiesForEmail1.length} policies for Email 1`);
    console.log(`Found ${policiesForEmail2.length} policies for Email 2`);

    // Combine and filter based on email_type request
    let policies: PolicyForEmail[] = [];
    if (!email_type || email_type === 'email1') {
      policies = [...policies, ...policiesForEmail1];
    }
    if (!email_type || email_type === 'email2') {
      policies = [...policies, ...policiesForEmail2];
    }

    return new Response(
      JSON.stringify({ 
        policies,
        test_mode,
        total_count: policies.length,
        email1_count: policiesForEmail1.length,
        email2_count: policiesForEmail2.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in get-policies-for-email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        policies: [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
