# Make.com Scenario Setup Guide

## Webhook URL
`https://hook.us2.make.com/9c7md7mxdsg264527b3gv78u3xvssvgc`

## Step-by-Step Setup Instructions

### 1. Create New Scenario
1. Go to Make.com and click "Create a new scenario"
2. Name it: **Policy Email Automation**

### 2. Add Webhook Trigger (Module 1)
1. Click the **+** button to add first module
2. Search for **Webhooks** → Select **Custom webhook**
3. Click **Add** to create a new webhook
4. **IMPORTANT**: Use the existing webhook with URL above
   - Or create new one and update the app's webhook URL in database

### 3. Add Iterator (Module 2)
1. Add new module → Search **Iterator**
2. Connect it after the webhook
3. Configure:
   - **Array**: `{{1.policies}}`

### 4. Add Router (Module 3)
1. Add new module → Search **Router**
2. Connect after Iterator

### 5. Configure Email Route 1 (37-day reminder)

#### 5a. Add Filter on Route 1
- **Label**: Email 1 Route
- **Condition**: `{{2.email_type}}` equals `email1`

#### 5b. Add Microsoft 365 Email Module
1. Select **Microsoft 365 Email** → **Send an Email**
2. Choose connection: `policyreminder@prlinsurance.com`
3. Configure fields:
   - **To**: `{{2.client_email}}`
   - **CC**: `{{2.agent_email}}`
   - **BCC**: `Shustinedominiquie@gmail.com`
   - **From**: `PRL Insurance <policyreminder@prlinsurance.com>`
   - **Subject**: `Annual Umbrella Policy Review - New Format`
   - **Content Type**: HTML
   - **Body**: See Email Template 1 below

#### 5c. Add HTTP Module (Update Status)
1. Add module after email → Search **HTTP** → **Make a request**
2. Configure:
   - **URL**: `https://mkfaphusizsjgcpkepld.supabase.co/functions/v1/update-email-status`
   - **Method**: POST
   - **Headers**:
     - `Content-Type`: `application/json`
     - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rZmFwaHVzaXpzamdjcGtlcGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTc4NDEsImV4cCI6MjA3ODM3Mzg0MX0.eL0ny4LyK1GviQB8IbC-MXS3AlRnqIOYC6Tq6f6ROdo`
   - **Body**:
     ```json
     {
       "policy_id": "{{2.id}}",
       "email_type": "email1"
     }
     ```

### 6. Configure Email Route 2 (Overdue reminder)

#### 6a. Add Filter on Route 2
- **Label**: Email 2 Route  
- **Condition**: `{{2.email_type}}` equals `email2`

#### 6b. Add Microsoft 365 Email Module
Same as Route 1 but with:
   - **Subject**: `Reminder: Complete Your Umbrella Policy Review`
   - **Body**: See Email Template 2 below

#### 6c. Add HTTP Module (Update Status)
Same as Route 1 but with:
   - **Body**:
     ```json
     {
       "policy_id": "{{2.id}}",
       "email_type": "email2"
     }
     ```

### 7. Add Webhook Response (Final Module)
1. After router branches merge, add **Webhooks** → **Webhook Response**
2. Configure:
   - **Status**: 200
   - **Body**: 
     ```json
     {
       "success": true,
       "processed": "{{length(1.policies)}}"
     }
     ```
   - **Headers**:
     - `Content-Type`: `application/json`

### 8. Activate Scenario
1. Click **Save** (disk icon)
2. Toggle **ON** to activate

---

## Email Template 1 (37-day reminder)

```html
<!DOCTYPE html>
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
</html>
```

## Email Template 2 (Overdue reminder)

```html
<!DOCTYPE html>
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
</html>
```

---

## Testing
1. Once activated, use Test Mode in the app to send test data
2. Check Make.com execution history to verify it's working
3. Verify emails are received and status updates work

## Troubleshooting
- If webhook shows "Gone", ensure scenario is **activated** (ON switch)
- Check Make.com execution logs for detailed errors
- Verify Microsoft 365 connection has permission to send emails
