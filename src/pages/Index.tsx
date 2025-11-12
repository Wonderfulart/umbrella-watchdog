import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PolicySummaryCards } from "@/components/PolicySummaryCards";
import { PolicyTable } from "@/components/PolicyTable";
import { AddPolicyDialog } from "@/components/AddPolicyDialog";
import { EmailAutomationPanel } from "@/components/EmailAutomationPanel";
import { AgentManagement } from "@/components/AgentManagement";
import { BulkImportDialog } from "@/components/BulkImportDialog";
import { StorageUploader } from "@/components/StorageUploader";
import { SetupGuide } from "@/components/SetupGuide";
import { EmailActivityDashboard } from "@/components/EmailActivityDashboard";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [loading, setLoading] = useState(true);
  const [logoUploaded, setLogoUploaded] = useState(false);
  const { toast } = useToast();

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

  const checkLogoStatus = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("email-assets")
        .list();
      
      if (error) throw error;
      
      const hasLogo = data?.some((file) => file.name === "prl-hero-logo.png");
      setLogoUploaded(hasLogo || false);
    } catch (error) {
      console.error("Error checking logo:", error);
    }
  };

  useEffect(() => {
    fetchPolicies();
    checkLogoStatus();
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

    const email1Count = policies.filter((p) => {
      const expDate = new Date(p.expiration_date);
      return expDate >= today && expDate <= upcoming37Days && !p.jotform_submitted && !p.email1_sent;
    }).length;

    const email2Count = policies.filter(
      (p) => new Date(p.expiration_date) < today && !p.jotform_submitted && !p.email2_sent
    ).length;

    return { upcoming, pending, completed, overdue, email1Count, email2Count };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Policy Renewal Dashboard</h1>
            <p className="text-muted-foreground">Track umbrella insurance policy renewals</p>
          </div>
          <div className="flex gap-2">
            <BulkImportDialog onImportComplete={fetchPolicies} />
            <AddPolicyDialog onPolicyAdded={fetchPolicies} />
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
            <SetupGuide logoUploaded={logoUploaded} />
            <PolicySummaryCards
              upcomingCount={stats.upcoming}
              pendingCount={stats.pending}
              completedCount={stats.completed}
              overdueCount={stats.overdue}
            />
            <EmailAutomationPanel 
              email1Count={stats.email1Count}
              email2Count={stats.email2Count}
              onRefresh={fetchPolicies}
            />
            <Tabs defaultValue="policies" className="w-full">
              <TabsList>
                <TabsTrigger value="policies">Policies</TabsTrigger>
                <TabsTrigger value="email-activity">Email Activity</TabsTrigger>
                <TabsTrigger value="agents">Agent Management</TabsTrigger>
                <TabsTrigger value="storage">Storage Uploader</TabsTrigger>
              </TabsList>
              <TabsContent value="policies" className="mt-6">
                <PolicyTable policies={policies} />
              </TabsContent>
              <TabsContent value="email-activity" className="mt-6">
                <EmailActivityDashboard policies={policies} />
              </TabsContent>
              <TabsContent value="agents" className="mt-6">
                <AgentManagement />
              </TabsContent>
              <TabsContent value="storage" className="mt-6">
                <StorageUploader />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
