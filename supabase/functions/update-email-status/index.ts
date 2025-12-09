import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface EmailStatusUpdate {
  policy_id: string;
  email_type: 'email1' | 'email2';
  status: 'sent' | 'failed';
  error_message?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Received email status update:', JSON.stringify(body, null, 2));

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Support both single update and batch updates
    const updates: EmailStatusUpdate[] = Array.isArray(body) ? body : [body];
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const update of updates) {
      const { policy_id, email_type, status, error_message } = update;

      if (!policy_id || !email_type || !status) {
        results.failed++;
        results.errors.push(`Missing required fields for policy ${policy_id}`);
        continue;
      }

      try {
        const now = new Date().toISOString();

        // Update policy record
        const updateData: Record<string, any> = {};
        
        if (email_type === 'email1') {
          updateData.email1_sent = status === 'sent';
          updateData.email1_sent_date = status === 'sent' ? now : null;
        } else if (email_type === 'email2') {
          updateData.email2_sent = status === 'sent';
          updateData.email2_sent_date = status === 'sent' ? now : null;
        }

        const { error: policyError } = await supabase
          .from('policies')
          .update(updateData)
          .eq('id', policy_id);

        if (policyError) {
          throw policyError;
        }

        // Get policy details for email log
        const { data: policy } = await supabase
          .from('policies')
          .select('client_email, policy_number')
          .eq('id', policy_id)
          .single();

        // Log the email
        const { error: logError } = await supabase
          .from('email_logs')
          .insert({
            policy_id,
            email_type,
            recipient_email: policy?.client_email || 'unknown',
            status,
            error_message: error_message || null,
            sent_at: now,
          });

        if (logError) {
          console.error('Error logging email:', logError);
        }

        results.success++;
        console.log(`Updated ${email_type} status for policy ${policy_id}: ${status}`);
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to update policy ${policy_id}: ${error.message}`);
        console.error(`Error updating policy ${policy_id}:`, error);
      }
    }

    console.log('Update results:', JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({
        ...results,
        success: results.failed === 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in update-email-status:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to update email status',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
