import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, Info, Terminal } from 'lucide-react';

export function CronSetupInstructions() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const cronSql = `-- Set up daily automated email reminders at 9 AM UTC
SELECT cron.schedule(
  'daily-email-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
      url:='${supabaseUrl}/functions/v1/trigger-outlook-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${supabaseAnonKey}"}'::jsonb,
      body:='{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);

-- To check if the cron job is active:
SELECT * FROM cron.job WHERE jobname = 'daily-email-reminders';

-- To disable the cron job:
SELECT cron.unschedule('daily-email-reminders');`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <CardTitle>Automated Email Scheduling (Advanced)</CardTitle>
        </div>
        <CardDescription>
          Set up daily automated email reminders using pg_cron
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>What does this do?</AlertTitle>
          <AlertDescription>
            When configured, the system will automatically send pending email reminders daily at 9:00 AM UTC.
            Both Email 1 and Email 2 reminders will be processed based on policy expiration dates.
          </AlertDescription>
        </Alert>

        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Setup Instructions</AlertTitle>
          <AlertDescription className="space-y-2">
            <p className="font-medium">Run this SQL in your database:</p>
            <pre className="mt-2 overflow-x-auto bg-muted p-3 rounded text-xs">
              {cronSql}
            </pre>
            <p className="mt-2 text-xs text-muted-foreground">
              Note: pg_cron and pg_net extensions are already enabled for your database.
            </p>
          </AlertDescription>
        </Alert>

        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <h4 className="font-semibold text-sm">Alternative: Manual Trigger</h4>
          <p className="text-sm text-muted-foreground">
            If you prefer not to set up automated scheduling, you can use the "Send Email Reminders" 
            buttons in the Email Automation section to manually trigger emails whenever needed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
