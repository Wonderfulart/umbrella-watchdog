-- Fix enable_email_cron function to handle case when job doesn't exist
CREATE OR REPLACE FUNCTION public.enable_email_cron(p_schedule text, p_function_url text, p_anon_key text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- First unschedule if exists (wrapped in its own block to catch errors)
  BEGIN
    PERFORM cron.unschedule('daily-email-reminders');
  EXCEPTION WHEN OTHERS THEN
    -- Job doesn't exist yet, that's fine - continue
    NULL;
  END;
  
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
  RAISE EXCEPTION 'Failed to schedule cron job. Ensure pg_cron extension is enabled: %', SQLERRM;
END;
$function$;