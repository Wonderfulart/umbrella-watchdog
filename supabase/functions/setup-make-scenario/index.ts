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

    // Find Outlook/Office365 connection
    const outlookConnection = connections.connections?.find(
      (conn: any) => 
        conn.name?.toLowerCase().includes('outlook') || 
        conn.name?.toLowerCase().includes('office') ||
        conn.accountName?.toLowerCase().includes('outlook')
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
                    from: '',
                    subject: 'Reminder: Your {{2.company_name}} Policy Expires in 37 Days',
                    contentType: 'HTML',
                    body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; background: #f9f9f9; }
    .policy-card { background: white; border-left: 4px solid #0066cc; padding: 20px; margin: 20px 0; }
    .cta-button { display: inline-block; padding: 15px 30px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Policy Renewal Reminder</h1>
    </div>
    <div class="content">
      <p>Hi {{2.client_first_name}},</p>
      <p>This is a friendly reminder that your insurance policy is set to expire soon.</p>
      <div class="policy-card">
        <h3>Policy Details</h3>
        <p><strong>Policy Number:</strong> {{2.policy_number}}</p>
        <p><strong>Company:</strong> {{2.company_name}}</p>
        <p><strong>Expiration Date:</strong> {{2.expiration_date}}</p>
        <p><strong>Customer Number:</strong> {{2.customer_number}}</p>
      </div>
      <p>To ensure continuous coverage, please submit your renewal form as soon as possible.</p>
      <center>
        <a href="{{2.submission_link}}" class="cta-button">Submit Renewal Form</a>
      </center>
      <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
      <p>Best regards,<br>Your Insurance Team</p>
    </div>
    <div class="footer">
      <p>This is an automated reminder. Please do not reply to this email.</p>
      <p>Agent Contact: {{2.agent_email}}</p>
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
                    from: '',
                    subject: 'URGENT: Your {{2.company_name}} Policy Has Expired - Action Required',
                    contentType: 'HTML',
                    body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
    .urgent-banner { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .content { padding: 30px; background: #f9f9f9; }
    .policy-card { background: white; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; }
    .cta-button { display: inline-block; padding: 15px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ URGENT: Policy Expired</h1>
    </div>
    <div class="content">
      <div class="urgent-banner">
        <strong>⚠️ ACTION REQUIRED:</strong> Your policy has expired and needs immediate attention.
      </div>
      <p>Hi {{2.client_first_name}},</p>
      <p>Our records show that your insurance policy has expired and we have not yet received your renewal submission.</p>
      <div class="policy-card">
        <h3>Policy Details</h3>
        <p><strong>Policy Number:</strong> {{2.policy_number}}</p>
        <p><strong>Company:</strong> {{2.company_name}}</p>
        <p><strong>Expiration Date:</strong> {{2.expiration_date}} (EXPIRED)</p>
        <p><strong>Customer Number:</strong> {{2.customer_number}}</p>
      </div>
      <p><strong>You may currently be without coverage.</strong> Please submit your renewal form immediately to avoid any gaps in protection.</p>
      <center>
        <a href="{{2.submission_link}}" class="cta-button">SUBMIT NOW</a>
      </center>
      <p>If you have already submitted your renewal or have questions, please contact your agent immediately.</p>
      <p>Best regards,<br>Your Insurance Team</p>
    </div>
    <div class="footer">
      <p>This is an automated reminder. Please do not reply to this email.</p>
      <p><strong>Agent Contact:</strong> {{2.agent_email}}</p>
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
