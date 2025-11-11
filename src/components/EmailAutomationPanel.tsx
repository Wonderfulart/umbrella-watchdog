import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const handleSetup = async () => {
    setIsSettingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-make-scenario');
      
      if (error) throw error;

      if (data.success) {
        toast({
          title: "Setup Complete!",
          description: `Make.com scenario configured successfully with ${data.outlookConnectionName}`,
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
        body: { email_type: emailType },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Emails Sent!",
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
              Manage automated email reminders for policy renewals
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
              'Configure Make.com'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>{email1Count} policies need 37-day reminder</span>
            </div>
            <Button
              onClick={() => handleSendEmails('email1')}
              disabled={isSendingEmail1 || email1Count === 0}
              className="w-full"
              variant="default"
            >
              {isSendingEmail1 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email 1 Reminders
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
              disabled={isSendingEmail2 || email2Count === 0}
              className="w-full"
              variant="destructive"
            >
              {isSendingEmail2 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email 2 Reminders
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
              disabled={isSendingAll || (email1Count === 0 && email2Count === 0)}
              className="w-full"
              variant="secondary"
            >
              {isSendingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send All Pending
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
