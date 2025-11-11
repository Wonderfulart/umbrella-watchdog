import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface EmailAutomationPanelProps {
  email1Count: number;
  email2Count: number;
  onRefresh: () => void;
}

export const EmailAutomationPanel = ({ email1Count, email2Count, onRefresh }: EmailAutomationPanelProps) => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isSendingEmail1, setIsSendingEmail1] = useState(false);
  const [isSendingEmail2, setIsSendingEmail2] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const { toast } = useToast();

  const handleSetup = async () => {
    setIsSettingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-make-scenario');
      
      if (error) throw error;

      if (data.success) {
        toast({
          title: "Webhook Configured ✓",
          description: `Using ${data.outlookConnectionName}. Emails are ready to send.`,
        });
      } else {
        throw new Error(data.error || 'Setup failed');
      }
    } catch (error: any) {
      console.error('Setup error:', error);
      toast({
        title: "Setup Failed",
        description: error.message || 'Failed to configure Make.com scenario',
        variant: "destructive",
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleSendEmails = async (emailType: 'email1' | 'email2' | 'all') => {
    const setLoading = emailType === 'email1' ? setIsSendingEmail1 : 
                       emailType === 'email2' ? setIsSendingEmail2 : 
                       setIsSendingAll;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('trigger-outlook-emails', {
        body: { email_type: emailType, test_mode: testMode },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: testMode ? "🧪 Test Emails Sent!" : "Emails Sent!",
          description: data.message || `Successfully sent ${data.sent} emails`,
        });
        onRefresh();
      } else {
        throw new Error(data.error || 'Failed to send emails');
      }
    } catch (error: any) {
      console.error('Send error:', error);
      toast({
        title: "Failed to Send",
        description: error.message || 'Failed to trigger emails',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Automation Control
            </CardTitle>
            <CardDescription>
              Click "Configure" to verify webhook connection, then send emails
            </CardDescription>
          </div>
          <Button
            onClick={handleSetup}
            disabled={isSettingUp}
            variant="outline"
            size="sm"
          >
            {isSettingUp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              'Configure Webhook'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <Switch
              id="test-mode"
              checked={testMode}
              onCheckedChange={setTestMode}
            />
            <Label htmlFor="test-mode" className="flex items-center gap-2 cursor-pointer">
              <FlaskConical className="h-4 w-4" />
              <span className="font-medium">Test Mode</span>
            </Label>
          </div>
          {testMode && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-200">Test Mode Active</p>
                <p className="text-amber-800 dark:text-amber-300 mt-1">
                  Emails will be sent regardless of dates and sent status. Status flags will NOT be updated. Limited to 10 policies per type.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>{email1Count} policies need 37-day reminder</span>
            </div>
            <Button
              onClick={() => handleSendEmails('email1')}
              disabled={isSendingEmail1 || (!testMode && email1Count === 0)}
              className="w-full"
              variant={testMode ? "outline" : "default"}
            >
              {isSendingEmail1 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email 1{testMode ? ' (Test)' : ' Reminders'}
                </>
              )}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span>{email2Count} policies need overdue reminder</span>
            </div>
            <Button
              onClick={() => handleSendEmails('email2')}
              disabled={isSendingEmail2 || (!testMode && email2Count === 0)}
              className="w-full"
              variant={testMode ? "outline" : "destructive"}
            >
              {isSendingEmail2 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email 2{testMode ? ' (Test)' : ' Reminders'}
                </>
              )}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span>Send all pending emails</span>
            </div>
            <Button
              onClick={() => handleSendEmails('all')}
              disabled={isSendingAll || (!testMode && email1Count === 0 && email2Count === 0)}
              className="w-full"
              variant={testMode ? "outline" : "secondary"}
            >
              {isSendingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send All{testMode ? ' (Test)' : ' Pending'}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
