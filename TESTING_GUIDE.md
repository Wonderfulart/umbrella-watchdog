# Email Automation Testing Guide

## Overview
This guide covers testing the complete email automation system including logging, error handling, and scheduled automation.

---

## Stage 2: Testing & Verification

### Test 1: Error Logging (5 min)
**Purpose:** Verify that failed emails are properly logged with error messages

**Steps:**
1. Navigate to **Email Automation Panel**
2. Temporarily change webhook URL to an invalid URL (e.g., `https://invalid-url.com`)
3. Enable **Test Mode**
4. Click **Send Email 1** for a few policies
5. Go to **Email Activity Dashboard → Email Logs** tab
6. **Expected Result:** 
   - Logs show `failed` status with red badge
   - Error message displays webhook failure details
   - No changes to policy email status flags (test mode)

### Test 2: Successful Email Flow - Test Mode (5 min)
**Purpose:** Verify test mode sends emails without updating database flags

**Steps:**
1. Restore correct Make.com webhook URL
2. Ensure **Test Mode** is enabled (toggle ON)
3. Click **Send Email 1** for 2-3 policies
4. Check **Email Activity Dashboard → Email Logs**
5. Check **Policies Table** for those policies
6. **Expected Result:**
   - Email logs show `sent` status with green badge
   - Recipient email, policy number, and timestamp display correctly
   - `email1_sent` flag in policies table remains `false`
   - `email1_sent_date` remains `null`

### Test 3: Production Mode Email Sending (5 min)
**Purpose:** Verify production mode sends emails AND updates database

**Steps:**
1. Disable **Test Mode** (toggle OFF)
2. Click **Send Email 1** for 2-3 NEW policies (not previously tested)
3. Check **Email Activity Dashboard → Email Logs**
4. Check **Policies Table** for those policies
5. **Expected Result:**
   - Email logs show `sent` status
   - `email1_sent` flag updates to `true` in policies table
   - `email1_sent_date` shows current timestamp
   - Real-time dashboard updates immediately

### Test 4: Scheduled Automation Setup (3 min)
**Purpose:** Verify automation toggle creates cron job correctly

**Steps:**
1. Go to **Email Automation Panel**
2. Set desired automation time (e.g., 9:00 AM)
3. Toggle **Scheduled Automation** to ON
4. Check automation status indicator
5. **Expected Result:**
   - Status shows "Active" with green indicator
   - Automation time displays correctly
   - Cron job created in backend (check via database)

### Test 5: Real-Time Dashboard Updates (2 min)
**Purpose:** Verify dashboard updates automatically when new logs arrive

**Steps:**
1. Open **Email Activity Dashboard** in browser
2. Send a test email from another tab/window
3. Watch the **Email Logs** tab
4. **Expected Result:**
   - New log appears automatically (no page refresh needed)
   - Statistics cards update in real-time
   - Timestamp shows current time

---

## Stage 3: Production Readiness Checklist

### Configuration
- [ ] Upload `prl-hero-logo.png` to Storage Uploader
- [ ] Verify logo URL is accessible in storage bucket
- [ ] Configure Make.com webhook URL in automation settings
- [ ] Set desired automation schedule time (default: 9 AM)
- [ ] Enable scheduled automation

### Make.com Integration
- [ ] Copy webhook URL from Setup Guide
- [ ] Configure Make.com scenario to call `update-email-status` webhook
- [ ] Test Make.com scenario end-to-end
- [ ] Verify Make.com sends correct payload:
  ```json
  {
    "policy_id": "uuid-of-policy",
    "email_type": "email1" // or "email2"
  }
  ```

### Final Verification
- [ ] Test complete flow: trigger → Make.com → email send → status update
- [ ] Verify all email logs appear in dashboard
- [ ] Check error handling with intentional failures
- [ ] Confirm scheduled automation runs at correct time
- [ ] Validate email templates render correctly with logo

---

## Troubleshooting

### Issue: Emails not logging
**Solution:** Check that `update-email-status` edge function is being called by Make.com

### Issue: Failed status not appearing
**Solution:** Verify `trigger-outlook-emails` has been deployed with enhanced error logging

### Issue: Real-time updates not working
**Solution:** Confirm `email_logs` table has realtime enabled in Supabase

### Issue: Test mode still updating flags
**Solution:** Ensure `test_mode` parameter is passed to edge functions correctly

---

## Monitoring

### Key Metrics to Watch
- **Success Rate:** Should be >95% in production
- **Failed Deliveries:** Investigate any failures immediately
- **Email Logs:** Review daily for anomalies
- **Automation Status:** Ensure stays "Active"

### Daily Checks
1. Review Email Activity Dashboard statistics
2. Check for any failed emails in logs
3. Verify automation is running on schedule
4. Monitor policy table for correct status updates

---

## Support

For issues or questions:
1. Check edge function logs in Lovable Cloud backend
2. Review network requests in browser dev tools
3. Verify Make.com scenario execution logs
4. Consult this testing guide
