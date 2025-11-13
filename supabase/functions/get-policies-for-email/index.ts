import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RequestSchema = z.object({
  email_type: z.enum(['email1', 'email2']),
  test_mode: z.boolean().optional().default(false),
});

interface PolicyForEmail {
  id: string;
  client_first_name: string;
  client_email: string;
  customer_number: string;
  policy_number: string;
  company_name: string;
  expiration_date: string;
  agent_first_name: string;
  agent_last_name: string;
  agent_email: string;
  agent_company_logo_url: string | null;
  submission_link: string;
  email_type: string;
}

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
    const validationResult = RequestSchema.safeParse(payload);
    
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('policies')
      .select('*');

    if (!test_mode) {
      const today = new Date().toISOString().split('T')[0];
      const email1Date = new Date();
      email1Date.setDate(email1Date.getDate() + 37);
      const email1DateStr = email1Date.toISOString().split('T')[0];

      if (email_type === 'email1') {
        query = query
          .eq('email1_sent', false)
          .lte('expiration_date', email1DateStr)
          .gte('expiration_date', today);
      } else {
        query = query
          .eq('email1_sent', true)
          .eq('email2_sent', false)
          .eq('jotform_submitted', false)
          .lt('expiration_date', today);
      }
    } else {
      query = query.limit(5);
    }

    const { data: policies, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch policies' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const policiesForEmail: PolicyForEmail[] = (policies || []).map((policy: any) => ({
      id: policy.id,
      client_first_name: policy.client_first_name,
      client_email: policy.client_email,
      customer_number: policy.customer_number,
      policy_number: policy.policy_number,
      company_name: policy.company_name,
      expiration_date: policy.expiration_date,
      agent_first_name: policy.agent_first_name,
      agent_last_name: policy.agent_last_name,
      agent_email: policy.agent_email,
      agent_company_logo_url: policy.agent_company_logo_url,
      submission_link: policy.submission_link,
      email_type,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        policies: policiesForEmail,
        count: policiesForEmail.length,
        test_mode,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
