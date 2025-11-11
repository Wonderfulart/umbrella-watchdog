import { corsHeaders } from '../_shared/cors.ts';

const MAKE_API_TOKEN = Deno.env.get('MAKE_API');
const MAKE_TEAM_ID = '1471864';
const MAKE_BASE_URL = 'https://us2.make.com/api/v2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Make.com scenario setup...');

    // Step 1: List all connections to find Outlook
    const connectionsResponse = await fetch(
      `${MAKE_BASE_URL}/connections?teamId=${MAKE_TEAM_ID}`,
      {
        headers: {
          'Authorization': `Token ${MAKE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!connectionsResponse.ok) {
      throw new Error(`Failed to fetch connections: ${connectionsResponse.statusText}`);
    }

    const connections = await connectionsResponse.json();
    console.log('Found connections:', connections);

    // Find Outlook/Office365/Microsoft connection
    const outlookConnection = connections.connections?.find(
      (conn: any) => 
        conn.name?.toLowerCase().includes('outlook') || 
        conn.name?.toLowerCase().includes('office') ||
        conn.name?.toLowerCase().includes('microsoft') ||
        conn.accountName?.toLowerCase().includes('outlook') ||
        conn.accountName?.toLowerCase().includes('azure') ||
        conn.accountLabel?.toLowerCase().includes('microsoft')
    );

    if (!outlookConnection) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No Outlook connection found. Please connect your Outlook account in Make.com first.',
          availableConnections: connections.connections?.map((c: any) => ({
            name: c.name,
            type: c.accountName,
          })),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Found Outlook connection:', outlookConnection);

    // Step 2: Get webhook details to find scenario ID
    const webhookUrl = 'https://hook.us2.make.com/wxml33sjjwewwo2jbnkvyxmkm3eook7a';
    const webhookId = webhookUrl.split('/').pop();
    
    const webhooksResponse = await fetch(
      `${MAKE_BASE_URL}/hooks?teamId=${MAKE_TEAM_ID}`,
      {
        headers: {
          'Authorization': `Token ${MAKE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const webhooks = await webhooksResponse.json();
    const webhook = webhooks.hooks?.find((h: any) => h.url === webhookUrl || h.name?.includes(webhookId));
    
    if (!webhook) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Webhook not found in your Make.com account',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Found webhook:', webhook);
    const scenarioId = webhook.scenarioId;

    // Step 3: Build the complete scenario blueprint
    const scenarioBlueprint = {
      name: 'Policy Email Automation',
      scheduling: {
        type: 'indefinitely',
      },
      flow: [
        {
          id: 1,
          module: 'gateway:CustomWebHook',
          version: 1,
          parameters: {
            hook: webhook.id,
            maxResults: 1,
          },
          mapper: {},
          metadata: {
            designer: { x: 0, y: 0 },
            restore: {},
            expect: [
              {
                name: 'policies',
                type: 'array',
                label: 'Policies',
                required: true,
              },
            ],
          },
        },
        {
          id: 2,
          module: 'builtin:BasicIterator',
          version: 1,
          parameters: {},
          mapper: {
            array: '{{1.policies}}',
          },
          metadata: {
            designer: { x: 300, y: 0 },
            restore: {
              expect: {
                array: { mode: 'edit' },
              },
            },
          },
        },
        {
          id: 3,
          module: 'builtin:BasicRouter',
          version: 1,
          parameters: {},
          mapper: null,
          metadata: {
            designer: { x: 600, y: 0 },
          },
          routes: [
            {
              flow: [
                {
                  id: 4,
                  module: 'microsoft-365-email:ActionSendAnEmail',
                  version: 3,
                  parameters: {
                    account: outlookConnection.id,
                  },
                  mapper: {
                    to: '{{2.client_email}}',
                    cc: '{{2.agent_email}}',
                    bcc: 'Shustinedominiquie@gmail.com',
                    from: 'PRL Insurance <policyreminder@prlinsurance.com>',
                    subject: 'Annual Umbrella Policy Review - New Format',
                    contentType: 'HTML',
                    body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #003B72; color: white; padding: 30px 20px; text-align: center; }
    .header img { max-width: 200px; height: auto; margin-bottom: 15px; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; background: #f9f9f9; }
    .policy-card { background: white; border-left: 4px solid #003B72; padding: 20px; margin: 20px 0; }
    .cta-button { display: inline-block; padding: 15px 30px; background: #003B72; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .agent-signature { background: white; padding: 20px; margin: 20px 0; border-top: 2px solid #003B72; }
    .agent-info { display: flex; align-items: center; gap: 15px; }
    .agent-logo { width: 60px; height: 60px; object-fit: contain; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://mkfaphusizsjgcpkepld.supabase.co/storage/v1/object/public/email-assets/prl-hero-logo.png" alt="PRL Insurance Logo" />
      <h1>Umbrella Policy Review</h1>
    </div>
    <div class="content">
      <p>Hi {{2.client_first_name}},</p>
      <p>We are transitioning our annual umbrella review questionnaires to a new format. Please see the link below for your umbrella renewal. We want to make sure we have the most up to date information. If you prefer, please call our office to talk to an agent.</p>
      <div class="policy-card">
        <h3>Policy Details</h3>
        <p><strong>Policy Number:</strong> {{2.policy_number}}</p>
        <p><strong>Company:</strong> {{2.company_name}}</p>
        <p><strong>Expiration Date:</strong> {{2.expiration_date}}</p>
        <p><strong>Customer Number:</strong> {{2.customer_number}}</p>
      </div>
      <center>
        <a href="{{2.submission_link}}" class="cta-button">Complete Your Review</a>
      </center>
      <div class="agent-signature">
        <div class="agent-info">
          <img src="{{2.agent_company_logo_url}}" alt="Company Logo" class="agent-logo" />
          <div>
            <p style="margin: 0; font-weight: bold;">{{2.agent_first_name}} {{2.agent_last_name}}</p>
            <p style="margin: 5px 0 0 0; color: #666;">Insurance Agent</p>
            <p style="margin: 5px 0 0 0;"><a href="mailto:{{2.agent_email}}" style="color: #003B72;">{{2.agent_email}}</a></p>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      <p><strong>PRL Insurance</strong></p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`,
                  },
                  metadata: {
                    designer: { x: 900, y: -150 },
                    restore: {
                      expect: {
                        to: { mode: 'edit' },
                        cc: { mode: 'edit' },
                        bcc: { mode: 'edit' },
                        subject: { mode: 'edit' },
                        body: { mode: 'edit' },
                      },
                    },
                  },
                },
                {
                  id: 5,
                  module: 'http:ActionSendData',
                  version: 3,
                  parameters: {},
                  mapper: {
                    url: 'https://mkfaphusizsjgcpkepld.supabase.co/functions/v1/update-email-status',
                    method: 'post',
                    headers: [
                      {
                        name: 'Content-Type',
                        value: 'application/json',
                      },
                      {
                        name: 'Authorization',
                        value: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZmFwaHVzaXpzamdjcGtlcGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTc4NDEsImV4cCI6MjA3ODM3Mzg0MX0.eL0ny4LyK1GviQB8IbC-MXS3AlRnqIOYC6Tq6f6ROdo',
                      },
                    ],
                    qs: [],
                    body: JSON.stringify({
                      policy_id: '{{2.id}}',
                      email_type: 'email1',
                    }),
                  },
                  metadata: {
                    designer: { x: 1200, y: -150 },
                  },
                },
              ],
              filter: {
                name: 'Email 1 Route',
                conditions: [
                  [
                    {
                      a: '{{2.email_type}}',
                      o: 'text:equal',
                      b: 'email1',
                    },
                  ],
                ],
              },
            },
            {
              flow: [
                {
                  id: 6,
                  module: 'microsoft-365-email:ActionSendAnEmail',
                  version: 3,
                  parameters: {
                    account: outlookConnection.id,
                  },
                  mapper: {
                    to: '{{2.client_email}}',
                    cc: '{{2.agent_email}}',
                    bcc: 'Shustinedominiquie@gmail.com',
                    from: 'PRL Insurance <policyreminder@prlinsurance.com>',
                    subject: 'Reminder: Complete Your Umbrella Policy Review',
                    contentType: 'HTML',
                    body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #003B72; color: white; padding: 30px 20px; text-align: center; }
    .header img { max-width: 200px; height: auto; margin-bottom: 15px; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; background: #f9f9f9; }
    .policy-card { background: white; border-left: 4px solid #003B72; padding: 20px; margin: 20px 0; }
    .cta-button { display: inline-block; padding: 15px 30px; background: #003B72; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .agent-signature { background: white; padding: 20px; margin: 20px 0; border-top: 2px solid #003B72; }
    .agent-info { display: flex; align-items: center; gap: 15px; }
    .agent-logo { width: 60px; height: 60px; object-fit: contain; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://mkfaphusizsjgcpkepld.supabase.co/storage/v1/object/public/email-assets/prl-hero-logo.png" alt="PRL Insurance Logo" />
      <h1>Umbrella Policy Review Reminder</h1>
    </div>
    <div class="content">
      <p>Hi {{2.client_first_name}},</p>
      <p>You were recently sent this umbrella review questionnaire to complete for the upcoming renewal of your personal umbrella policy. This is a new format that we are using. Please see the link below for your umbrella renewal. We want to make sure we have the most up to date information. If you prefer, please call our office to talk to an agent.</p>
      <div class="policy-card">
        <h3>Policy Details</h3>
        <p><strong>Policy Number:</strong> {{2.policy_number}}</p>
        <p><strong>Company:</strong> {{2.company_name}}</p>
        <p><strong>Expiration Date:</strong> {{2.expiration_date}}</p>
        <p><strong>Customer Number:</strong> {{2.customer_number}}</p>
      </div>
      <center>
        <a href="{{2.submission_link}}" class="cta-button">Complete Your Review</a>
      </center>
      <div class="agent-signature">
        <div class="agent-info">
          <img src="{{2.agent_company_logo_url}}" alt="Company Logo" class="agent-logo" />
          <div>
            <p style="margin: 0; font-weight: bold;">{{2.agent_first_name}} {{2.agent_last_name}}</p>
            <p style="margin: 5px 0 0 0; color: #666;">Insurance Agent</p>
            <p style="margin: 5px 0 0 0;"><a href="mailto:{{2.agent_email}}" style="color: #003B72;">{{2.agent_email}}</a></p>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      <p><strong>PRL Insurance</strong></p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`,
                  },
                  metadata: {
                    designer: { x: 900, y: 150 },
                    restore: {
                      expect: {
                        to: { mode: 'edit' },
                        cc: { mode: 'edit' },
                        bcc: { mode: 'edit' },
                        subject: { mode: 'edit' },
                        body: { mode: 'edit' },
                      },
                    },
                  },
                },
                {
                  id: 7,
                  module: 'http:ActionSendData',
                  version: 3,
                  parameters: {},
                  mapper: {
                    url: 'https://mkfaphusizsjgcpkepld.supabase.co/functions/v1/update-email-status',
                    method: 'post',
                    headers: [
                      {
                        name: 'Content-Type',
                        value: 'application/json',
                      },
                      {
                        name: 'Authorization',
                        value: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZmFwaHVzaXpzamdjcGtlcGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTc4NDEsImV4cCI6MjA3ODM3Mzg0MX0.eL0ny4LyK1GviQB8IbC-MXS3AlRnqIOYC6Tq6f6ROdo',
                      },
                    ],
                    qs: [],
                    body: JSON.stringify({
                      policy_id: '{{2.id}}',
                      email_type: 'email2',
                    }),
                  },
                  metadata: {
                    designer: { x: 1200, y: 150 },
                  },
                },
              ],
              filter: {
                name: 'Email 2 Route',
                conditions: [
                  [
                    {
                      a: '{{2.email_type}}',
                      o: 'text:equal',
                      b: 'email2',
                    },
                  ],
                ],
              },
            },
          ],
        },
        {
          id: 8,
          module: 'gateway:WebhookRespond',
          version: 1,
          parameters: {},
          mapper: {
            status: '200',
            body: JSON.stringify({
              success: true,
              processed: '{{length(1.policies)}}',
            }),
            headers: [
              {
                key: 'Content-Type',
                value: 'application/json',
              },
            ],
          },
          metadata: {
            designer: { x: 1500, y: 0 },
          },
        },
      ],
    };

    // Step 4: Update the scenario
    const updateResponse = await fetch(
      `${MAKE_BASE_URL}/scenarios/${scenarioId}?teamId=${MAKE_TEAM_ID}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${MAKE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scenarioBlueprint),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update scenario: ${errorText}`);
    }

    const updatedScenario = await updateResponse.json();
    console.log('Scenario updated successfully:', updatedScenario);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Make.com scenario configured successfully',
        scenarioId,
        outlookConnectionId: outlookConnection.id,
        outlookConnectionName: outlookConnection.name,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error setting up Make.com scenario:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
