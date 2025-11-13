import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PolicyImportRow {
  [key: string]: any;
}

interface ImportRequest {
  policies: PolicyImportRow[];
  columnMapping: Record<string, string>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { policies, columnMapping }: ImportRequest = await req.json();

    console.log(`Starting bulk import of ${policies.length} policies`);

    // Fetch active agents
    const { data: agents, error: agentsError } = await supabase
      .from("agents")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (agentsError) throw agentsError;
    if (!agents || agents.length === 0) {
      throw new Error("No active agents found. Please add agents first.");
    }

    // Get current round-robin index
    const { data: config, error: configError } = await supabase
      .from("automation_config")
      .select("id, last_assigned_agent_index")
      .single();

    if (configError) throw configError;

    let currentIndex = config?.last_assigned_agent_index || 0;

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    // Helper function to convert Excel serial date to YYYY-MM-DD
    const convertExcelDate = (value: any): string => {
      // If it's already a string in date format, return it
      if (typeof value === 'string' && value.includes('-')) {
        return value.split('T')[0]; // Remove time if present
      }
      
      // If it's a number (Excel serial date), convert it
      if (typeof value === 'number') {
        // Excel serial date: days since January 1, 1900
        const excelEpoch = new Date(1900, 0, 1);
        const daysOffset = value - 2; // Excel incorrectly treats 1900 as leap year
        const date = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000);
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // Try to parse as date string
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      throw new Error(`Invalid date format: ${value}`);
    };

    // Process each policy
    for (let i = 0; i < policies.length; i++) {
      const row = policies[i];

      try {
        // Map columns to database fields
        const policyData = {
          customer_number: String(row[columnMapping.customer_number]),
          policy_number: String(row[columnMapping.policy_number]),
          client_first_name: row[columnMapping.client_first_name],
          client_email: row[columnMapping.client_email],
          agent_email: row[columnMapping.agent_email],
          expiration_date: convertExcelDate(row[columnMapping.expiration_date]),
          company_name: row[columnMapping.company_name],
        };

        // Validate required fields
        const requiredFields = [
          "customer_number",
          "policy_number",
          "client_first_name",
          "client_email",
          "agent_email",
          "expiration_date",
          "company_name",
        ];

        for (const field of requiredFields) {
          if (!policyData[field as keyof typeof policyData]) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        // Check for duplicates
        const { data: existing } = await supabase
          .from("policies")
          .select("id")
          .eq("policy_number", policyData.policy_number)
          .single();

        if (existing) {
          console.log(`Skipping duplicate policy: ${policyData.policy_number}`);
          results.skipped++;
          continue;
        }

        // Assign agent in round-robin fashion
        const assignedAgent = agents[currentIndex % agents.length];
        currentIndex++;

        // Auto-generate submission link
        const baseUrl = "https://form.jotform.com/250873904844061";
        const submissionLink = `${baseUrl}?policyNumber=${encodeURIComponent(policyData.policy_number)}&typeA=${encodeURIComponent(policyData.customer_number)}`;

        // Insert policy with agent assignment
        const { error: insertError } = await supabase.from("policies").insert([
          {
            ...policyData,
            submission_link: submissionLink,
            agent_first_name: assignedAgent.first_name,
            agent_last_name: assignedAgent.last_name,
            agent_company_logo_url: assignedAgent.company_logo_url,
            jotform_submitted: false,
            email1_sent: false,
            email2_sent: false,
          },
        ]);

        if (insertError) throw insertError;

        console.log(
          `Imported policy ${policyData.policy_number}, assigned to ${assignedAgent.first_name} ${assignedAgent.last_name}`
        );
        results.imported++;
      } catch (error: any) {
        console.error(`Error processing row ${i + 1}:`, error);
        results.errors.push({
          row: i + 1,
          error: error.message,
        });
      }
    }

    // Update round-robin index
    await supabase
      .from("automation_config")
      .update({ last_assigned_agent_index: currentIndex })
      .eq("id", config.id);

    console.log(`Import complete: ${results.imported} imported, ${results.skipped} skipped, ${results.errors.length} errors`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Bulk import error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
