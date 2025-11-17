import { CheckCircle2, Circle, Upload, ExternalLink, Copy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface SetupGuideProps {
  logoUploaded: boolean;
  automationEnabled: boolean;
}

export const SetupGuide = ({ logoUploaded, automationEnabled }: SetupGuideProps) => {
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-email-status`;
  
  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook URL copied to clipboard");
  };

  const steps: SetupStep[] = [
    {
      id: "upload",
      title: "Upload PRL Logo",
      description: "Upload prl-hero-logo.png to the Storage Uploader tab",
      completed: logoUploaded,
    },
    {
      id: "automation",
      title: "Enable Scheduled Automation",
      description: "Turn on daily automation in the Email Automation panel",
      completed: automationEnabled,
    },
    {
      id: "test",
      title: "Test Email Automation",
      description: "Use Test Mode to send a test email and verify it works",
      completed: false,
    },
  ];

  const allComplete = steps.every((step) => step.completed);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Setup Guide
          {allComplete && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>
          Complete these steps to finish your email automation setup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!logoUploaded && (
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              Go to the <strong>Storage Uploader</strong> tab and upload the <code>prl-hero-logo.png</code> file from your public folder.
              The file name must be exactly <code>prl-hero-logo.png</code> for the email templates to work.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card"
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h4 className="font-medium">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {allComplete && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Setup complete! Your email automation is ready to use.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6 pt-6 border-t space-y-4">
          <h4 className="font-medium text-sm">Make.com Configuration</h4>
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription className="space-y-3">
              <p className="font-medium">Configure your Make.com scenario to call this webhook after sending emails:</p>
              <div className="flex items-center gap-2 p-2 bg-muted rounded font-mono text-xs break-all">
                <code className="flex-1">{webhookUrl}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyWebhookUrl}
                  className="flex-shrink-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm">
                <strong>Required payload:</strong> <code>{`{ "policy_id": "uuid", "email_type": "email1" | "email2" }`}</code>
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};
