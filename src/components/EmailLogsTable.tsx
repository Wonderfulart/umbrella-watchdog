import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface EmailLog {
  id: string;
  policy_id: string;
  email_type: 'email1' | 'email2';
  sent_at: string;
  recipient_email: string;
  status: 'sent' | 'failed' | 'bounced';
  error_message: string | null;
  make_execution_id: string | null;
}

interface Policy {
  id: string;
  policy_number: string;
  client_first_name: string;
}

export function EmailLogsTable() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [policies, setPolicies] = useState<Map<string, Policy>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('email_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Fetch policy details for all logs
      if (logsData && logsData.length > 0) {
        const policyIds = [...new Set(logsData.map((log) => log.policy_id))];
        const { data: policiesData, error: policiesError } = await supabase
          .from('policies')
          .select('id, policy_number, client_first_name')
          .in('id', policyIds);

        if (policiesError) throw policiesError;

        const policiesMap = new Map(
          policiesData?.map((p) => [p.id, p]) || []
        );
        setPolicies(policiesMap);
      }

      setLogs((logsData as EmailLog[]) || []);
    } catch (error: any) {
      console.error('Error fetching email logs:', error);
      toast.error('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'bounced':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-500">Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'bounced':
        return <Badge variant="secondary" className="bg-yellow-500">Bounced</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Logs</CardTitle>
          <CardDescription>Track all sent email notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No email logs yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Logs</CardTitle>
        <CardDescription>
          Track all sent email notifications ({logs.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Policy</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Email Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const policy = policies.get(log.policy_id);
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.sent_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {policy ? (
                        <>
                          {policy.policy_number}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {policy.client_first_name}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>{log.recipient_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.email_type === 'email1' ? 'Email 1' : 'Email 2'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.error_message ? (
                        <span className="text-xs text-red-500">{log.error_message}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
