-- Create function to enable email cron job
CREATE OR REPLACE FUNCTION public.enable_email_cron(
  p_schedule TEXT,
  p_function_url TEXT,
  p_anon_key TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First unschedule if exists
  PERFORM cron.unschedule('daily-email-reminders');
  
  -- Schedule new job
  PERFORM cron.schedule(
    'daily-email-reminders',
    p_schedule,
    format(
      'SELECT net.http_post(url:=%L, headers:=%L::jsonb, body:=%L::jsonb) as request_id;',
      p_function_url,
      format('{"Content-Type": "application/json", "Authorization": "Bearer %s"}', p_anon_key),
      '{}'
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- If cron extension is not available, raise a more helpful error
  RAISE EXCEPTION 'Failed to schedule cron job. Ensure pg_cron extension is enabled: %', SQLERRM;
END;
$$;