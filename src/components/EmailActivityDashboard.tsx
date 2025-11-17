import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailActivityTable } from "./EmailActivityTable";
import { EmailLogsTable } from "./EmailLogsTable";
import { Mail, CheckCircle, XCircle, MailCheck, Activity, AlertCircle } from "lucide-react";

interface Policy {
  id: string;
  customer_number: string;
  policy_number: string;
  client_first_name: string;
  company_name: string;
  client_email: string;
  expiration_date: string;
  email1_sent: boolean;
  email1_sent_date: string | null;
  email2_sent: boolean;
  email2_sent_date: string | null;
}

interface EmailLog {
  id: string;
  policy_id: string;
  email_type: string;
  recipient_email: string;
  sent_at: string;
  status: string;
  error_message?: string;
  policy?: {
    policy_number: string;
    client_first_name: string;
  };
}

interface EmailActivityDashboardProps {
  policies: Policy[];
  emailLogs: EmailLog[];
}

export const EmailActivityDashboard = ({ policies, emailLogs }: EmailActivityDashboardProps) => {
  const [filter, setFilter] = useState("all");

  const calculateStats = () => {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const oneMonth = 30 * 24 * 60 * 60 * 1000;

    const thisWeekCount = policies.filter((p) => {
      const email1ThisWeek = p.email1_sent_date && (now - new Date(p.email1_sent_date).getTime()) < oneWeek;
      const email2ThisWeek = p.email2_sent_date && (now - new Date(p.email2_sent_date).getTime()) < oneWeek;
      return email1ThisWeek || email2ThisWeek;
    }).length;

    const thisMonthCount = policies.filter((p) => {
      const email1ThisMonth = p.email1_sent_date && (now - new Date(p.email1_sent_date).getTime()) < oneMonth;
      const email2ThisMonth = p.email2_sent_date && (now - new Date(p.email2_sent_date).getTime()) < oneMonth;
      return email1ThisMonth || email2ThisMonth;
    }).length;

    const noEmailsCount = policies.filter((p) => !p.email1_sent && !p.email2_sent).length;
    const bothEmailsCount = policies.filter((p) => p.email1_sent && p.email2_sent).length;

    // Email logs stats
    const totalEmailsSent = emailLogs.length;
    const failedEmails = emailLogs.filter((log) => log.status === 'failed').length;
    const successRate = totalEmailsSent > 0 ? ((totalEmailsSent - failedEmails) / totalEmailsSent * 100).toFixed(1) : '0';

    return { thisWeekCount, thisMonthCount, noEmailsCount, bothEmailsCount, totalEmailsSent, failedEmails, successRate };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeekCount}</div>
            <p className="text-xs text-muted-foreground">Emails sent this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <MailCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthCount}</div>
            <p className="text-xs text-muted-foreground">Emails sent this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Emails</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.noEmailsCount}</div>
            <p className="text-xs text-muted-foreground">Policies with no emails sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bothEmailsCount}</div>
            <p className="text-xs text-muted-foreground">Both emails sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmailsSent}</div>
            <p className="text-xs text-muted-foreground">Total emails sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedEmails}</div>
            <p className="text-xs text-muted-foreground">Failed deliveries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">Delivery success</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Activity</CardTitle>
          <CardDescription>Track when emails were sent to clients</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All Policies</TabsTrigger>
              <TabsTrigger value="email1">Email 1 Sent</TabsTrigger>
              <TabsTrigger value="email2">Email 2 Sent</TabsTrigger>
              <TabsTrigger value="none">No Emails</TabsTrigger>
              <TabsTrigger value="both">Both Sent</TabsTrigger>
            </TabsList>
            <TabsContent value={filter} className="mt-6">
              <EmailActivityTable policies={policies} filter={filter} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
