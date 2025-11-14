-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to check if cron job exists
CREATE OR REPLACE FUNCTION public.check_cron_status()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM cron.job 
    WHERE jobname = 'daily-email-reminders'
  );
$$;

-- Function to disable email cron job
CREATE OR REPLACE FUNCTION public.disable_email_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM cron.unschedule('daily-email-reminders');
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.check_cron_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.disable_email_cron() TO authenticated;