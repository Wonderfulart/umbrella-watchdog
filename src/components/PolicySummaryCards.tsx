import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface PolicySummaryCardsProps {
  upcomingCount: number;
  pendingCount: number;
  completedCount: number;
  overdueCount: number;
}

export const PolicySummaryCards = ({
  upcomingCount,
  pendingCount,
  completedCount,
  overdueCount,
}: PolicySummaryCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Renewals</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingCount}</div>
          <p className="text-xs text-muted-foreground">Next 37 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">{pendingCount}</div>
          <p className="text-xs text-muted-foreground">Awaiting JotForm</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{completedCount}</div>
          <p className="text-xs text-muted-foreground">Forms submitted</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
          <p className="text-xs text-muted-foreground">Past expiration</p>
        </CardContent>
      </Card>
    </div>
  );
};