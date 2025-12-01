import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { TrendingUp, Mail, CheckCircle2, XCircle } from "lucide-react";

interface AnalyticsDashboardProps {
  emailLogs: any[];
  policies: any[];
}

export const AnalyticsDashboard = ({ emailLogs, policies }: AnalyticsDashboardProps) => {
  // Calculate email success rate
  const totalEmails = emailLogs.length;
  const successfulEmails = emailLogs.filter((log) => log.status === "sent").length;
  const failedEmails = totalEmails - successfulEmails;
  const successRate = totalEmails > 0 ? ((successfulEmails / totalEmails) * 100).toFixed(1) : 0;

  // Email trends over last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayLogs = emailLogs.filter((log) => {
      const logDate = startOfDay(new Date(log.sent_at));
      return logDate.getTime() === dayStart.getTime();
    });
    
    return {
      date: format(date, "MMM dd"),
      sent: dayLogs.filter((l) => l.status === "sent").length,
      failed: dayLogs.filter((l) => l.status === "failed").length,
    };
  });

  // Policy expiration distribution
  const today = new Date();
  const expirationBuckets = [
    { name: "Overdue", count: 0, color: "#ef4444" },
    { name: "< 30 days", count: 0, color: "#f59e0b" },
    { name: "30-60 days", count: 0, color: "#eab308" },
    { name: "60-90 days", count: 0, color: "#22c55e" },
    { name: "> 90 days", count: 0, color: "#3b82f6" },
  ];

  policies.forEach((policy) => {
    if (policy.jotform_submitted) return;
    
    const expDate = new Date(policy.expiration_date);
    const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) expirationBuckets[0].count++;
    else if (daysUntil < 30) expirationBuckets[1].count++;
    else if (daysUntil < 60) expirationBuckets[2].count++;
    else if (daysUntil < 90) expirationBuckets[3].count++;
    else expirationBuckets[4].count++;
  });

  // Email type distribution
  const email1Count = emailLogs.filter((log) => log.email_type === "reminder1").length;
  const email2Count = emailLogs.filter((log) => log.email_type === "reminder2").length;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmails}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {successfulEmails} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successfulEmails}</div>
            <p className="text-xs text-muted-foreground">Delivered emails</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedEmails}</div>
            <p className="text-xs text-muted-foreground">Failed deliveries</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Email Activity (Last 7 Days)</CardTitle>
            <CardDescription>Daily email send volume and status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sent" fill="hsl(var(--primary))" name="Sent" />
                <Bar dataKey="failed" fill="hsl(var(--destructive))" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policy Expiration Distribution</CardTitle>
            <CardDescription>Policies by time until expiration</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expirationBuckets}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, count }) => `${name}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {expirationBuckets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Type Distribution</CardTitle>
            <CardDescription>Breakdown by reminder type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "First Reminder", value: email1Count },
                    { name: "Follow-up Reminder", value: email2Count },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--accent))" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Success Trend</CardTitle>
            <CardDescription>Success rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sent"
                  stroke="hsl(var(--primary))"
                  name="Sent"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
