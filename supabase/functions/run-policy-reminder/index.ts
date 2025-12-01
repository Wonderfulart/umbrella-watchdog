import { corsHeaders } from '../_shared/cors.ts';

const COMPOSIO_API_KEY = Deno.env.get('COMPOSIO_API_KEY');
const COMPOSIO_API_URL = 'https://backend.composio.dev/api/v1/cli/recipe-executor';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Rube AI policy reminder execution...');

    if (!COMPOSIO_API_KEY) {
      throw new Error('COMPOSIO_API_KEY is not configured');
    }

    // Call Composio recipe executor with hardcoded parameters
    const response = await fetch(COMPOSIO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': COMPOSIO_API_KEY,
      },
      body: JSON.stringify({
        recipeId: 'rcp_95xzswjMtgCI',
        params: {
          excel_file_id: '01ZEIPJXYUUYRZCE5JK5FLDZ7UFMQ7DNFL',
          jotform_link: 'https://form.jotform.com/250873904844061',
          days_before_expiration: '37',
          days_after_first_email: '7',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Composio API error:', response.status, errorText);
      throw new Error(`Composio API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Composio response:', JSON.stringify(data, null, 2));

    if (!data.successful) {
      throw new Error(data.error || 'Recipe execution failed');
    }

    const result = {
      success: true,
      first_emails_sent: data.data?.first_emails_sent || 0,
      followup_emails_sent: data.data?.followup_emails_sent || 0,
      policies_checked: data.data?.policies_checked || 0,
      summary: data.data?.summary || 'Policy reminders completed',
      errors: data.data?.errors || [],
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
