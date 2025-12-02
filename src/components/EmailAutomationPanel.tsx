import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2, CheckCircle, Clock, Play, Pause, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { usePolicyReminder } from "@/hooks/usePolicyReminder";
import { PolicyReminderStats } from "./PolicyReminderStats";

interface EmailAutomationPanelProps {
  onRefresh: () => void;
}

export const EmailAutomationPanel = ({ onRefresh }: EmailAutomationPanelProps) => {
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [isTogglingAutomation, setIsTogglingAutomation] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [isTestResult, setIsTestResult] = useState(false);
  const { execute, loading, testLoading, result } = usePolicyReminder();
  const { toast } = useToast();

  useEffect(() => {
    checkAutomationStatus();
  }, []);

  const checkAutomationStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('check_cron_status');
      if (error) throw error;
      setAutomationEnabled(data || false);
    } catch (error) {
      console.error('Error checking automation status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleToggleAutomation = async () => {
    setIsTogglingAutomation(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-email-cron', {
        body: { enabled: !automationEnabled, time: '09:00' },
      });

      if (error) throw error;

      if (data.success) {
        setAutomationEnabled(!automationEnabled);
        toast({
          title: data.enabled ? "Automation Enabled ✓" : "Automation Disabled",
          description: data.message,
        });
      } else {
        throw new Error(data.error || 'Failed to configure automation');
      }
    } catch (error: any) {
      console.error('Automation toggle error:', error);
      toast({
        title: "Configuration Failed",
        description: error.message || 'Failed to update automation settings',
        variant: "destructive",
      });
    } finally {
      setIsTogglingAutomation(false);
    }
  };

  const handleRunReminders = async (testMode: boolean = false) => {
    try {
      const data = await execute({ testMode });
      setShowResult(true);
      setIsTestResult(testMode);
      
      if (testMode) {
        toast({
          title: "Test Run Complete",
          description: data.summary,
        });
      } else {
        toast({
          title: "Policy Reminders Sent!",
          description: `Sent ${data.first_emails_sent} first emails and ${data.followup_emails_sent} follow-ups`,
        });
        onRefresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reminders",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Automation Control
        </CardTitle>
        <CardDescription>
          Automated policy reminders via Rube AI recipe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scheduled Automation Toggle */}
        <div className="p-4 rounded-lg border bg-muted/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">Scheduled Automation</h3>
                <p className="text-sm text-muted-foreground">
                  Run email reminders automatically every day at 9:00 AM
                </p>
              </div>
            </div>
            <Switch
              checked={automationEnabled}
              onCheckedChange={handleToggleAutomation}
              disabled={isTogglingAutomation || checkingStatus}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={automationEnabled ? "default" : "secondary"} className="flex items-center gap-1">
              {automationEnabled ? (
                <>
                  <Play className="h-3 w-3" />
                  Active - Daily at 9:00 AM
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3" />
                  Inactive
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Run Reminders Buttons */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={() => handleRunReminders(true)}
              disabled={loading || testLoading}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              {testLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Test Run
                </>
              )}
            </Button>
            <Button
              onClick={() => handleRunReminders(false)}
              disabled={loading || testLoading}
              size="lg"
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Emails
                </>
              )}
            </Button>
          </div>

          {showResult && result && (
            <div className={`p-4 rounded-lg border ${
              isTestResult 
                ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900' 
                : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
            }`}>
              <div className="flex items-start gap-3">
                {isTestResult ? (
                  <FlaskConical className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold ${
                    isTestResult 
                      ? 'text-blue-900 dark:text-blue-100' 
                      : 'text-green-900 dark:text-green-100'
                  }`}>
                    {isTestResult ? 'Test Complete' : 'Success!'}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    isTestResult 
                      ? 'text-blue-700 dark:text-blue-300' 
                      : 'text-green-700 dark:text-green-300'
                  }`}>
                    {result.summary}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Display */}
        {showResult && result && (
          <PolicyReminderStats
            policiesChecked={result.policies_checked}
            firstEmailsSent={result.first_emails_sent}
            followupsSent={result.followup_emails_sent}
            errors={result.errors?.length || 0}
          />
        )}
      </CardContent>
    </Card>
  );
};
