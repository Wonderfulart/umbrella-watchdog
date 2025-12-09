import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MAKE_WEBHOOK_URL = Deno.env.get('MAKE_WEBHOOK_URL') || 'https://hook.us2.make.com/6fnrlop1r3v8ndfjchxguwvfx3if5gir';
const JOTFORM_LINK = 'https://form.jotform.com/250873904844061';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const testMode = body?.testMode === true;

    console.log(`Starting policy reminder execution... (testMode: ${testMode})`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find policies expiring within 37 days that haven't received first email
    const firstEmailDate = new Date(today);
    firstEmailDate.setDate(firstEmailDate.getDate() + 37);

    const { data: firstReminderPolicies, error: firstError } = await supabase
      .from('policies')
      .select('*')
      .lte('expiration_date', firstEmailDate.toISOString().split('T')[0])
      .gt('expiration_date', today.toISOString().split('T')[0])
      .or('email1_sent.is.null,email1_sent.eq.false');

    if (firstError) throw firstError;

    // Find policies that received first email 7+ days ago but no follow-up
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: followupPolicies, error: followupError } = await supabase
      .from('policies')
      .select('*')
      .eq('email1_sent', true)
      .eq('jotform_submitted', false) // Only send follow-ups to customers who haven't submitted the form
      .not('email1_sent_date', 'is', null)
      .lte('email1_sent_date', sevenDaysAgo.toISOString())
      .or('email2_sent.is.null,email2_sent.eq.false');

    if (followupError) throw followupError;

    const totalPoliciesChecked = (firstReminderPolicies?.length || 0) + (followupPolicies?.length || 0);

    console.log(`Found ${firstReminderPolicies?.length || 0} policies needing first reminder`);
    console.log(`Found ${followupPolicies?.length || 0} policies needing follow-up`);

    if (testMode) {
      console.log('TEST MODE: Returning simulated results without sending emails');
      const simulatedResult = {
        success: true,
        testMode: true,
        first_emails_sent: firstReminderPolicies?.length || 0,
        followup_emails_sent: followupPolicies?.length || 0,
        policies_checked: totalPoliciesChecked,
        summary: `TEST MODE: Would send ${firstReminderPolicies?.length || 0} first emails and ${followupPolicies?.length || 0} follow-up emails`,
        errors: [],
      };
      return new Response(
        JSON.stringify(simulatedResult),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const policiesToSend = [
      ...(firstReminderPolicies || []).map(p => ({
        id: p.id,
        policy_number: p.policy_number,
        client_first_name: p.client_first_name,
        client_email: p.client_email,
        agent_email: p.agent_email,
        expiration_date: p.expiration_date,
        submission_link: JOTFORM_LINK,
        email_type: 'email1',
        agent_first_name: p.agent_first_name || '',
        agent_last_name: p.agent_last_name || '',
      })),
      ...(followupPolicies || []).map(p => ({
        id: p.id,
        policy_number: p.policy_number,
        client_first_name: p.client_first_name,
        client_email: p.client_email,
        agent_email: p.agent_email,
        expiration_date: p.expiration_date,
        submission_link: JOTFORM_LINK,
        email_type: 'email2',
        agent_first_name: p.agent_first_name || '',
        agent_last_name: p.agent_last_name || '',
      })),
    ];

    let emailsSent = 0;
    const errors: string[] = [];

    if (policiesToSend.length > 0) {
      console.log(`Sending ${policiesToSend.length} policies to Make.com webhook...`);
      
      try {
        const makeResponse = await fetch(MAKE_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            policies: policiesToSend,
          }),
        });

        if (!makeResponse.ok) {
          const errorText = await makeResponse.text();
          throw new Error(`Make.com webhook error: ${makeResponse.status} ${errorText}`);
        }

        emailsSent = policiesToSend.length;
        console.log(`Successfully sent ${emailsSent} policies to Make.com`);
      } catch (error: any) {
        console.error('Error calling Make.com webhook:', error);
        errors.push(error.message);
      }
    }

    const result = {
      success: true,
      first_emails_sent: firstReminderPolicies?.length || 0,
      followup_emails_sent: followupPolicies?.length || 0,
      policies_checked: totalPoliciesChecked,
      summary: `Sent ${firstReminderPolicies?.length || 0} first emails and ${followupPolicies?.length || 0} follow-up emails via Make.com`,
      errors,
    };

    console.log('Returning result:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in run-policy-reminder:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to execute policy reminder',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
