-- Fix security warnings for database functions
-- Set search_path to make functions immutable

CREATE OR REPLACE FUNCTION public.check_cron_status()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM cron.job 
    WHERE jobname = 'daily-email-reminders'
  );
$$;

CREATE OR REPLACE FUNCTION public.disable_email_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM cron.unschedule('daily-email-reminders');
END;
$$;