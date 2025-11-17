import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";

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

interface EmailLogsTableProps {
  logs: EmailLog[];
}

export const EmailLogsTable = ({ logs }: EmailLogsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs.filter((log) => {
    const search = searchTerm.toLowerCase();
    return (
      log.recipient_email.toLowerCase().includes(search) ||
      log.policy?.policy_number?.toLowerCase().includes(search) ||
      log.email_type.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    if (status === "sent") {
      return <Badge variant="default" className="bg-green-500">Sent</Badge>;
    }
    if (status === "failed") {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getEmailTypeBadge = (type: string) => {
    if (type === "email1") {
      return <Badge variant="outline">First Reminder</Badge>;
    }
    if (type === "email2") {
      return <Badge variant="outline">Second Reminder</Badge>;
    }
    return <Badge variant="outline">{type}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by policy number, email, or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sent Date/Time</TableHead>
              <TableHead>Policy #</TableHead>
              <TableHead>Client Email</TableHead>
              <TableHead>Email Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time Ago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {searchTerm ? "No logs match your search" : "No email logs yet"}
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.sent_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.policy?.policy_number || "-"}
                  </TableCell>
                  <TableCell>{log.recipient_email}</TableCell>
                  <TableCell>{getEmailTypeBadge(log.email_type)}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(log.sent_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
