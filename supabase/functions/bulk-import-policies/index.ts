import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const PolicyRowSchema = z.object({
  customer_number: z.string().min(1).max(50).trim(),
  policy_number: z.string().min(1).max(100).trim(),
  client_first_name: z.string().min(1).max(100).trim(),
  client_email: z.string().email().max(255).trim(),
  agent_email: z.string().email().max(255).trim(),
  company_name: z.string().min(1).max(200).trim(),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  company_logo_url: z.string().url().max(500).optional(),
});

const ImportRequestSchema = z.object({
  policies: z.array(z.record(z.any())),
  columnMapping: z.record(z.string()),
});

function convertExcelDate(value: any): string {
  if (!value) return '';
  
  if (typeof value === 'string') {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (datePattern.test(value)) {
      return value;
    }
    
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return date.toISOString().split('T')[0];
  }
  
  return '';
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

    const requestBody = await req.json();
    const requestValidation = ImportRequestSchema.safeParse(requestBody);
    
    if (!requestValidation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format', 
          details: requestValidation.error.issues 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { policies, columnMapping } = requestValidation.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .order('created_at');

    if (agentsError || !agents || agents.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active agents available for assignment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: config } = await supabase
      .from('automation_config')
      .select('id, last_assigned_agent_index')
      .single();

    let currentAgentIndex = config?.last_assigned_agent_index || 0;
    
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const row of policies) {
      try {
        const mappedRow: Record<string, any> = {};
        for (const [field, column] of Object.entries(columnMapping)) {
          mappedRow[field] = row[column];
        }

        const rawExpirationDate = mappedRow['expiration_date'];
        const convertedDate = convertExcelDate(rawExpirationDate);
        mappedRow['expiration_date'] = convertedDate;

        const policyValidation = PolicyRowSchema.safeParse(mappedRow);
        
        if (!policyValidation.success) {
          results.errors.push(`Invalid data: ${policyValidation.error.issues[0].message}`);
          results.skipped++;
          continue;
        }

        const validPolicy = policyValidation.data;

        const { data: existing } = await supabase
          .from('policies')
          .select('id')
          .eq('policy_number', validPolicy.policy_number)
          .maybeSingle();

        if (existing) {
          results.errors.push(`Policy ${validPolicy.policy_number} already exists`);
          results.skipped++;
          continue;
        }

        const assignedAgent = agents[currentAgentIndex];
        currentAgentIndex = (currentAgentIndex + 1) % agents.length;

        const policyData = {
          ...validPolicy,
          agent_first_name: assignedAgent.first_name,
          agent_last_name: assignedAgent.last_name,
          agent_email: assignedAgent.email,
          agent_company_logo_url: assignedAgent.company_logo_url,
          submission_link: `https://form.jotform.com/250206113971145?policyNumber=${validPolicy.policy_number}`,
        };

        const { error: insertError } = await supabase
          .from('policies')
          .insert(policyData);

        if (insertError) {
          results.errors.push(`Failed to import ${validPolicy.policy_number}: ${insertError.message}`);
          results.skipped++;
        } else {
          results.imported++;
        }
      } catch (error: any) {
        results.errors.push(`Unexpected error: ${error.message}`);
        results.skipped++;
      }
    }

    await supabase
      .from('automation_config')
      .update({ last_assigned_agent_index: currentAgentIndex })
      .eq('id', config?.id || '');

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        total: policies.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in bulk-import-policies:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
