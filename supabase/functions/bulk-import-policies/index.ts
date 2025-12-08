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
  updateMode?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { policies, columnMapping, updateMode = false }: ImportRequest = await req.json();

    console.log(`Starting bulk import of ${policies.length} policies (updateMode: ${updateMode})`);

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
      updated: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    // Helper function to fix scientific notation (e.g., "6.17E+12" -> "6170000000000")
    const fixScientificNotation = (value: any): string => {
      if (value === null || value === undefined) return "";
      
      const strValue = String(value);
      
      // Check if it's in scientific notation format
      if (/^-?\d+\.?\d*[eE][+-]?\d+$/.test(strValue)) {
        // Convert scientific notation to full number string
        const num = parseFloat(strValue);
        if (!isNaN(num)) {
          // Use toFixed(0) to get integer representation, then remove trailing zeros if needed
          return num.toLocaleString('fullwide', { useGrouping: false });
        }
      }
      
      return strValue;
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
        // Map columns to database fields with scientific notation fix
        const policyNumber = fixScientificNotation(row[columnMapping.policy_number]);
        const customerNumber = fixScientificNotation(row[columnMapping.customer_number]);

        const policyData = {
          customer_number: customerNumber,
          policy_number: policyNumber,
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

        // Check for existing policy
        const { data: existing } = await supabase
          .from("policies")
          .select("id")
          .eq("policy_number", policyData.policy_number)
          .single();

        if (existing) {
          if (updateMode) {
            // Update existing policy
            const { error: updateError } = await supabase
              .from("policies")
              .update({
                ...policyData,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id);

            if (updateError) throw updateError;

            console.log(`Updated policy: ${policyData.policy_number}`);
            results.updated++;
          } else {
            console.log(`Skipping duplicate policy: ${policyData.policy_number}`);
            results.skipped++;
          }
          continue;
        }

        // Assign agent in round-robin fashion for new policies
        const assignedAgent = agents[currentIndex % agents.length];
        currentIndex++;

        // Auto-generate submission link
        const baseUrl = "https://form.jotform.com/250873904844061";
        const submissionLink = `${baseUrl}?policyNumber=${encodeURIComponent(policyData.policy_number)}&typeA=${encodeURIComponent(policyData.customer_number)}`;

        // Insert new policy with agent assignment
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

    console.log(`Import complete: ${results.imported} imported, ${results.updated} updated, ${results.skipped} skipped, ${results.errors.length} errors`);

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
