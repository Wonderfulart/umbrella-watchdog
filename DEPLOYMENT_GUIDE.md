# Deployment Guide - Policy Renewal Dashboard

## Prerequisites

Before deploying, ensure you have:
- ✅ Lovable account with project access
- ✅ Composio API key configured in secrets
- ✅ Rube AI recipe configured (rcp_95xzswjMtgCI)
- ✅ Excel file with policy data on OneDrive/SharePoint
- ✅ Authentication system implemented
- ✅ Email templates seeded in database

---

## Pre-Deployment Checklist

### 1. Environment Configuration

**Required Secrets** (Already configured via Lovable Cloud):
- `COMPOSIO_API_KEY` - Your Composio API key
- `SUPABASE_URL` - Auto-configured by Lovable
- `SUPABASE_ANON_KEY` - Auto-configured by Lovable
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-configured by Lovable

### 2. Database Setup

**Verify Tables Exist:**
```sql
-- Check all required tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('policies', 'agents', 'email_logs', 'email_templates', 'automation_config', 'profiles', 'user_roles');
```

**Seed Email Templates** (if not already done):
```sql
-- Insert default email templates
INSERT INTO email_templates (name, subject, body, email_type, is_default) VALUES
('First Reminder', 
 'Your {{company_name}} Policy Expires Soon - Action Required',
 '<h2>Hello {{client_first_name}},</h2><p>This is a friendly reminder that your insurance policy #{{policy_number}} is set to expire on {{expiration_date}}.</p><p>To renew your policy, please visit: <a href="{{submission_link}}">{{submission_link}}</a></p><p>If you have any questions, please contact your agent {{agent_first_name}} {{agent_last_name}}.</p><p>Best regards,<br>{{company_name}}</p>',
 'reminder1',
 true),
('Follow-up Reminder',
 'Final Reminder: {{company_name}} Policy Expiring Soon',
 '<h2>Hello {{client_first_name}},</h2><p><strong>This is your final reminder</strong> that your insurance policy #{{policy_number}} expires on {{expiration_date}}.</p><p>Please take action immediately to avoid a lapse in coverage: <a href="{{submission_link}}">{{submission_link}}</a></p><p>Contact {{agent_first_name}} {{agent_last_name}} if you need assistance.</p><p>Best regards,<br>{{company_name}}</p>',
 'reminder2',
 true);
```

**Create First Admin User:**
```sql
-- After user signs up via the UI, grant admin role
INSERT INTO user_roles (user_id, role)
VALUES ('<USER_ID_FROM_AUTH>', 'admin'::app_role);
```

### 3. Rube AI Configuration

**Update Excel File ID** in `supabase/functions/run-policy-reminder/index.ts`:
```typescript
params: {
  excel_file_id: 'YOUR_EXCEL_FILE_ID_HERE', // Replace with your file ID
  jotform_link: 'YOUR_JOTFORM_LINK_HERE',
  days_before_expiration: '37',
  days_after_first_email: '7',
}
```

**Get Excel File ID:**
1. Go to OneDrive/SharePoint
2. Right-click your Excel file → Share → Copy link
3. Extract the file ID from the URL (the long alphanumeric string)

### 4. Testing in Staging

**Test Edge Functions:**
```bash
# Test policy reminder function
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/run-policy-reminder \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# Test cron job setup
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/setup-email-cron \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "hour": 9}'
```

**Test Authentication:**
1. Navigate to `/login` or `/signup`
2. Create a test user
3. Verify redirect to dashboard
4. Test logout functionality
5. Test protected routes (should redirect to login)

**Test Core Features:**
1. ✅ Add a policy manually
2. ✅ Import policies via CSV
3. ✅ View policy table with search
4. ✅ Check email automation panel
5. ✅ Run manual email test
6. ✅ View analytics dashboard
7. ✅ Edit email template
8. ✅ Check notifications center
9. ✅ Test bulk actions (select, export, delete)
10. ✅ Verify real-time updates

---

## Deployment Steps

### Step 1: Deploy via Lovable

1. **Open Lovable Dashboard**
   - Navigate to https://lovable.dev/projects/45a0866a-3684-447f-b0d3-598098f7e598

2. **Click "Publish"**
   - Located in top-right corner (desktop)
   - Or bottom-right in Preview mode (mobile)

3. **Review Changes**
   - Lovable shows all changes since last deployment
   - Review edge functions, database migrations, frontend changes

4. **Deploy**
   - Click "Update" to deploy
   - Frontend changes deploy immediately
   - Edge functions deploy automatically
   - Database migrations auto-apply

5. **Wait for Deployment**
   - Typically takes 1-2 minutes
   - You'll see a success message when complete

### Step 2: Verify Deployment

**Check Edge Functions:**
```bash
# Test if edge functions are live
curl https://YOUR_PROJECT_REF.supabase.co/functions/v1/run-policy-reminder \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Check Frontend:**
1. Visit your published URL (shown in Lovable after deployment)
2. Test login flow
3. Navigate through all tabs
4. Verify data loads correctly

### Step 3: Enable Scheduled Automation

1. Log in to the dashboard
2. Go to "Email Automation" panel
3. Set time to 9:00 AM (or preferred time)
4. Toggle "Scheduled Automation" to ON
5. Verify status shows "Active"

### Step 4: Monitor First Run

**Check Logs:**
- Go to Lovable → Cloud → Edge Functions → Logs
- Select `run-policy-reminder`
- Wait for scheduled run (or trigger manually)
- Verify no errors

**Check Email Logs:**
- Navigate to "Email Activity" tab
- Verify emails appear in the log
- Check success rate

---

## Post-Deployment

### Monitoring Setup

**Daily Checks:**
1. Review Supabase logs for errors
2. Check email success rate (should be >95%)
3. Verify cron job ran successfully
4. Monitor notification center for issues

**Weekly Checks:**
1. Review analytics dashboard trends
2. Check for failed emails and investigate
3. Verify policy data is up-to-date
4. Review user feedback

### Troubleshooting

**Edge Function Errors:**
```bash
# View edge function logs
# Go to: Lovable → Cloud → Edge Functions → select function → Logs
```

**Email Sending Issues:**
1. Check Composio API key is valid
2. Verify Excel file ID is correct
3. Check Rube AI recipe is active
4. Review email_logs table for error messages

**Authentication Issues:**
1. Verify Supabase Auth is enabled
2. Check RLS policies are correct
3. Ensure user has admin role in user_roles table
4. Clear browser cache and try again

**Cron Job Not Running:**
```sql
-- Check if cron job exists
SELECT * FROM cron.job WHERE jobname = 'daily-email-reminders';

-- Check cron job logs
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-email-reminders')
ORDER BY runid DESC LIMIT 10;
```

---

## Custom Domain Setup

### Add Custom Domain

1. **In Lovable:**
   - Go to Project → Settings → Domains
   - Click "Connect Domain"
   - Enter your domain (e.g., renewals.yourcompany.com)

2. **Update DNS Records:**
   - Add CNAME record in your DNS provider:
   - Name: `renewals` (or whatever subdomain you chose)
   - Value: Provided by Lovable
   - TTL: 300 seconds (5 minutes)

3. **Wait for Propagation:**
   - DNS changes can take 5-60 minutes
   - Lovable will verify automatically
   - You'll receive a notification when complete

4. **SSL Certificate:**
   - Lovable automatically provisions SSL certificate
   - Your site will be available at https://yourdomain.com

**Note:** Custom domain requires a paid Lovable plan.

---

## Scaling Considerations

### Performance Optimization

**For 100-500 policies:**
- Current setup is sufficient
- No changes needed

**For 500-2000 policies:**
- Add pagination to policy table
- Consider upgrading Supabase instance
- Add database indexes:
```sql
CREATE INDEX idx_policies_expiration ON policies(expiration_date);
CREATE INDEX idx_policies_email_status ON policies(email1_sent, email2_sent);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
```

**For 2000+ policies:**
- Implement virtual scrolling in tables
- Add caching layer (Redis)
- Consider batch processing for email sending
- Upgrade to Supabase Pro plan
- Monitor database performance metrics

### Cost Optimization

**Current Costs (estimate):**
- Lovable: Based on your plan ($0-$25/month)
- Supabase: Free tier covers ~50,000 rows, 2GB storage
- Composio: Based on recipe executions (~$0.10 per 1000 executions)

**To Reduce Costs:**
- Optimize database queries (fewer reads/writes)
- Reduce edge function cold starts (keep functions warm)
- Archive old email logs after 6 months
- Use Supabase's built-in analytics instead of external tools

---

## Security Best Practices

### Authentication
- ✅ Use strong passwords (12+ characters)
- ✅ Enable leaked password protection
- ✅ Use MFA for admin accounts (when available)
- ✅ Regularly audit user access

### Database
- ✅ Review RLS policies quarterly
- ✅ Use least privilege principle
- ✅ Never expose service role key to frontend
- ✅ Regularly backup data

### API Keys
- ✅ Rotate API keys every 90 days
- ✅ Use environment variables (never hardcode)
- ✅ Limit API key permissions
- ✅ Monitor API usage for anomalies

### Application
- ✅ Keep dependencies updated
- ✅ Use HTTPS only (Lovable handles this)
- ✅ Validate all user inputs
- ✅ Sanitize data before displaying

---

## Rollback Procedure

**If deployment fails or has critical issues:**

1. **Revert in Lovable:**
   - Go to Project → History
   - Find last working version
   - Click "Restore to this version"
   - Confirm restoration

2. **Database Rollback:**
   ```sql
   -- Supabase automatically versions migrations
   -- Contact Lovable support if you need to revert a migration
   ```

3. **Notify Users:**
   - If issue affected users, send notification
   - Explain what happened and when it's fixed
   - Document the issue for future reference

---

## Support & Resources

### Getting Help

**Lovable Support:**
- Discord: https://discord.com/channels/1119885301872070706/1280461670979993613
- Docs: https://docs.lovable.dev/
- Email: support@lovable.dev

**Supabase Support:**
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com/
- GitHub: https://github.com/supabase/supabase

**Composio/Rube Support:**
- Contact your Composio account representative
- Check Composio documentation

### Useful Links

- **Project URL**: https://lovable.dev/projects/45a0866a-3684-447f-b0d3-598098f7e598
- **Supabase Dashboard**: Via Lovable → Cloud
- **GitHub Repo**: (if connected)

---

## Conclusion

Your Policy Renewal Dashboard is now deployed! 🎉

**Next Steps:**
1. Monitor the first week closely
2. Gather user feedback
3. Iterate on features based on usage
4. Keep documentation updated

**Need help?** Refer to the troubleshooting section or contact support.

Good luck with your deployment! 🚀
