import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PolicySummaryCards } from "@/components/PolicySummaryCards";
import { PolicyTable } from "@/components/PolicyTable";
import { AddPolicyDialog } from "@/components/AddPolicyDialog";
import { EmailAutomationPanel } from "@/components/EmailAutomationPanel";
import { AgentManagement } from "@/components/AgentManagement";
import { BulkImportDialog } from "@/components/BulkImportDialog";
import { EmailActivityDashboard } from "@/components/EmailActivityDashboard";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { EmailTemplateEditor } from "@/components/EmailTemplateEditor";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface Policy {
  id: string;
  customer_number: string;
  policy_number: string;
  client_first_name: string;
  company_name: string;
  client_email: string;
  agent_email: string;
  expiration_date: string;
  submission_link: string;
  jotform_submitted: boolean;
  email1_sent: boolean;
  email1_sent_date: string | null;
  email2_sent: boolean;
  email2_sent_date: string | null;
  agent_first_name?: string;
  agent_last_name?: string;
  agent_company_logo_url?: string;
}

const Index = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Success",
      description: "Logged out successfully",
    });
    navigate("/auth");
  };

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .order("expiration_date", { ascending: true });

      if (error) throw error;
      setPolicies(data || []);
    } catch (error: any) {
      console.error("Error fetching policies:", error);
      toast({
        title: "Error",
        description: "Failed to load policies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("email_logs")
        .select(`
          *,
          policy:policies(policy_number, client_first_name)
        `)
        .order("sent_at", { ascending: false });

      if (error) throw error;
      setEmailLogs(data || []);
    } catch (error: any) {
      console.error("Error fetching email logs:", error);
    }
  };

  useEffect(() => {
    fetchPolicies();
    fetchEmailLogs();

    // Subscribe to email_logs changes for real-time updates
    const emailLogsChannel = supabase
      .channel('email-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_logs',
        },
        () => {
          fetchEmailLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(emailLogsChannel);
    };
  }, []);

  const calculateStats = () => {
    const today = new Date();
    const upcoming37Days = new Date(today);
    upcoming37Days.setDate(upcoming37Days.getDate() + 37);

    const upcoming = policies.filter((p) => {
      const expDate = new Date(p.expiration_date);
      return expDate >= today && expDate <= upcoming37Days && !p.jotform_submitted;
    }).length;

    const pending = policies.filter(
      (p) => new Date(p.expiration_date) >= today && !p.jotform_submitted
    ).length;

    const completed = policies.filter((p) => p.jotform_submitted).length;

    const overdue = policies.filter(
      (p) => new Date(p.expiration_date) < today && !p.jotform_submitted
    ).length;

    return { upcoming, pending, completed, overdue };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Policy Renewal Dashboard</h1>
            <p className="text-muted-foreground">Track umbrella insurance policy renewals</p>
            {user?.email && (
              <p className="text-sm text-muted-foreground mt-1">Logged in as {user.email}</p>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <NotificationCenter />
            <BulkImportDialog onImportComplete={fetchPolicies} />
            <AddPolicyDialog onPolicyAdded={fetchPolicies} />
            <Button variant="outline" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        ) : (
          <div className="space-y-8">
            <PolicySummaryCards
              upcomingCount={stats.upcoming}
              pendingCount={stats.pending}
              completedCount={stats.completed}
              overdueCount={stats.overdue}
            />
            <EmailAutomationPanel onRefresh={fetchPolicies} />
            <Tabs defaultValue="policies" className="w-full">
              <TabsList>
                <TabsTrigger value="policies">Policies</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="email-activity">Email Activity</TabsTrigger>
                <TabsTrigger value="templates">Email Templates</TabsTrigger>
                <TabsTrigger value="agents">Agent Management</TabsTrigger>
              </TabsList>
              <TabsContent value="policies" className="mt-6">
                <PolicyTable policies={policies} onRefresh={fetchPolicies} />
              </TabsContent>
              <TabsContent value="analytics" className="mt-6">
                <AnalyticsDashboard policies={policies} emailLogs={emailLogs} />
              </TabsContent>
              <TabsContent value="email-activity" className="mt-6">
                <EmailActivityDashboard policies={policies} emailLogs={emailLogs} />
              </TabsContent>
              <TabsContent value="templates" className="mt-6">
                <EmailTemplateEditor />
              </TabsContent>
              <TabsContent value="agents" className="mt-6">
                <AgentManagement />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
