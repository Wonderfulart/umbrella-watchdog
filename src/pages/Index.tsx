import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PolicySummaryCards } from "@/components/PolicySummaryCards";
import { PolicyTable } from "@/components/PolicyTable";
import { AddPolicyDialog } from "@/components/AddPolicyDialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Policy {
  id: string;
  policy_number: string;
  client_first_name: string;
  client_email: string;
  agent_email: string;
  expiration_date: string;
  jotform_submitted: boolean;
  email1_sent: boolean;
  email2_sent: boolean;
}

const Index = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchPolicies();
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
          </div>
          <AddPolicyDialog onPolicyAdded={fetchPolicies} />
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
            <PolicyTable policies={policies} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
