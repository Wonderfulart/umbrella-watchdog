# Quick Start Guide - Policy Renewal Dashboard

Get your policy renewal dashboard up and running in 15 minutes!

---

## Step 1: Initial Setup (2 minutes)

### Access Your Dashboard
1. Open the published URL (provided by Lovable)
2. You should see the dashboard homepage

### Configure Secrets
The following secrets should already be configured via Lovable Cloud:
- ✅ `COMPOSIO_API_KEY` - Your Composio/Rube AI API key
- ✅ `SUPABASE_URL` - Auto-configured
- ✅ `SUPABASE_ANON_KEY` - Auto-configured

To verify secrets:
1. Go to Lovable → Settings → Secrets
2. Confirm `COMPOSIO_API_KEY` is listed

---

## Step 2: Database Setup (3 minutes)

### Seed Email Templates

Run this SQL in Lovable → Cloud → Database → SQL Editor:

```sql
-- Insert default email templates
INSERT INTO email_templates (name, subject, body, email_type, is_default) VALUES
('First Reminder', 
 'Your {{company_name}} Policy Expires Soon - Action Required',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Hello {{client_first_name}},</h2>
    <p>This is a friendly reminder that your insurance policy <strong>#{{policy_number}}</strong> is set to expire on <strong>{{expiration_date}}</strong>.</p>
    <p>To renew your policy, please click the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{submission_link}}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Renew Now</a>
    </div>
    <p>If you have any questions, please contact your agent {{agent_first_name}} {{agent_last_name}}.</p>
    <p>Best regards,<br><strong>{{company_name}}</strong></p>
  </div>',
 'reminder1',
 true),
 
('Follow-up Reminder',
 'Final Reminder: {{company_name}} Policy Expiring Soon',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #DC2626;">Hello {{client_first_name}},</h2>
    <p><strong>This is your final reminder</strong> that your insurance policy <strong>#{{policy_number}}</strong> expires on <strong>{{expiration_date}}</strong>.</p>
    <p style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 15px; margin: 20px 0;">
      ⚠️ <strong>Action Required:</strong> Please renew immediately to avoid a lapse in coverage.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{submission_link}}" style="background-color: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Renew Now</a>
    </div>
    <p>Contact {{agent_first_name}} {{agent_last_name}} if you need assistance.</p>
    <p>Best regards,<br><strong>{{company_name}}</strong></p>
  </div>',
 'reminder2',
 true);
```

**✅ Success!** Email templates are now configured.

---

## Step 3: Add Your First Policy (3 minutes)

### Option A: Add Policy Manually
1. Click the "Add Policy" button in the top right
2. Fill in the policy details:
   - Customer Number: `CUST-001`
   - Policy Number: `POL-123456`
   - Client Name: `John Doe`
   - Client Email: `john@example.com`
   - Company: `ABC Insurance`
   - Agent Email: `agent@example.com`
   - Expiration Date: (30 days from now)
   - Submission Link: `https://form.jotform.com/your-form`
3. Click "Add Policy"

### Option B: Import Policies via CSV
1. Click "Bulk Import" button
2. Download the sample CSV template
3. Fill in your policy data
4. Upload the CSV file
5. Map columns if needed
6. Click "Import"

**✅ Success!** Your first policy is in the system.

---

## Step 4: Configure Rube AI (5 minutes)

### Update Excel File ID

1. **Upload your policy data to OneDrive/SharePoint**
   - Create an Excel file with your policies
   - Upload to OneDrive or SharePoint
   - Right-click → Share → Copy link
   - Extract the file ID from the URL

2. **Update Edge Function**
   
   In Lovable, go to:
   ```
   supabase/functions/run-policy-reminder/index.ts
   ```
   
   Update line 28:
   ```typescript
   params: {
     excel_file_id: 'YOUR_EXCEL_FILE_ID_HERE', // Replace this!
     jotform_link: 'YOUR_JOTFORM_LINK_HERE',   // Replace this!
     days_before_expiration: '37',
     days_after_first_email: '7',
   }
   ```

3. **Save and Deploy**
   - Lovable will auto-deploy the change
   - Wait ~30 seconds for deployment

**✅ Success!** Rube AI is configured.

---

## Step 5: Test Email Automation (2 minutes)

### Run a Test Email

1. Go to the dashboard
2. Click on "Email Automation" panel
3. Click "Run Policy Reminders" button
4. Wait for the result (10-30 seconds)
5. Check the "Email Activity" tab to see logs

**Expected Result:**
```
✓ First emails sent: 1
✓ Follow-up emails sent: 0
✓ Policies checked: 1
✓ Summary: Successfully processed policies
```

**✅ Success!** Email automation is working.

---

## Step 6: Enable Scheduled Automation (Optional)

### Set Up Daily Email Reminders

1. In the "Email Automation" panel:
   - Set time: `9:00 AM` (or your preferred time)
   - Toggle "Scheduled Automation" to ON
   - Verify status shows "Active ✓"

2. The system will now automatically:
   - Run daily at 9:00 AM
   - Check for expiring policies
   - Send reminder emails
   - Log all activity

**✅ Success!** Automation is scheduled.

---

## What's Next?

### Explore Features

**📊 Analytics Dashboard**
- View email success rates
- See policy expiration trends
- Track email activity over time

**📧 Email Templates**
- Customize email content
- Preview templates with sample data
- Use variables like `{{client_first_name}}`

**🔔 Notifications**
- Real-time alerts for expiring policies
- Email send status notifications
- Failed email alerts

**📋 Bulk Actions**
- Select multiple policies
- Export to CSV
- Test emails in bulk
- Delete multiple at once

**👥 Agent Management**
- Add insurance agents
- Track agent-specific policies
- Agent logos in emails

---

## Troubleshooting

### Emails Not Sending?
1. Check Composio API key is valid
2. Verify Excel file ID is correct
3. Check email logs for error messages
4. Ensure Rube AI recipe is active

### Can't See Policies?
1. Check you added at least one policy
2. Try refreshing the page
3. Check browser console for errors
4. Verify Supabase connection

### Automation Not Running?
1. Verify "Scheduled Automation" is ON
2. Check the scheduled time is correct
3. Wait until the scheduled time passes
4. Check edge function logs in Lovable → Cloud

### Need More Help?
- Check `PROJECT_AUDIT.md` for detailed troubleshooting
- Review `DEPLOYMENT_GUIDE.md` for advanced configuration
- Contact Lovable support via Discord

---

## Quick Reference

### Available Tabs
- **Policies**: View and manage all policies
- **Analytics**: Charts and trends
- **Email Activity**: Email logs and statistics
- **Email Templates**: Customize email content
- **Agent Management**: Manage insurance agents

### Email Variables
Use these in email templates:
- `{{client_first_name}}` - Client's first name
- `{{policy_number}}` - Policy number
- `{{expiration_date}}` - When policy expires
- `{{submission_link}}` - Renewal form link
- `{{agent_first_name}}` - Agent's first name
- `{{agent_last_name}}` - Agent's last name
- `{{company_name}}` - Insurance company name
- `{{customer_number}}` - Customer ID

### Keyboard Shortcuts
- `/` - Focus search box
- `Esc` - Close modals/dialogs
- `Ctrl/Cmd + K` - Quick command palette (coming soon)

---

## That's It! 🎉

Your policy renewal dashboard is ready to use. Start adding policies and automating your renewal process!

**Questions?** Check the full documentation or reach out for support.

**Happy renewing! 📬**
