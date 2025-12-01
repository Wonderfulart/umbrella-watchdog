import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, CheckCircle, AlertTriangle, Users } from 'lucide-react';

interface PolicyReminderStatsProps {
  policiesChecked: number;
  firstEmailsSent: number;
  followupsSent: number;
  errors: number;
}

export const PolicyReminderStats = ({
  policiesChecked,
  firstEmailsSent,
  followupsSent,
  errors
}: PolicyReminderStatsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Policies Checked</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{policiesChecked}</div>
          <p className="text-xs text-muted-foreground">Total policies reviewed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">First Reminders</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{firstEmailsSent}</div>
          <p className="text-xs text-muted-foreground">37 days before expiration</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{followupsSent}</div>
          <p className="text-xs text-muted-foreground">7 days after first email</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Errors</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{errors}</div>
          <p className="text-xs text-muted-foreground">Failed to send</p>
        </CardContent>
      </Card>
    </div>
  );
};
