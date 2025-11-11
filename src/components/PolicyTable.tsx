import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
  email2_sent: boolean;
}

interface PolicyTableProps {
  policies: Policy[];
}

export const PolicyTable = ({ policies }: PolicyTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (policy: Policy) => {
    const expirationDate = new Date(policy.expiration_date);
    const today = new Date();
    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (policy.jotform_submitted) {
      return <Badge className="bg-success text-success-foreground">Completed</Badge>;
    }

    if (daysUntilExpiration < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    }

    if (daysUntilExpiration <= 37) {
      return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
    }

    return <Badge variant="secondary">Active</Badge>;
  };

  const getEmailStatus = (email1Sent: boolean, email2Sent: boolean) => {
    if (email2Sent) return "2nd Reminder Sent";
    if (email1Sent) return "1st Reminder Sent";
    return "Not Sent";
  };

  const filteredPolicies = policies.filter(
    (policy) =>
      policy.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.customer_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.client_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.client_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by policy number, customer number, name, company, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer #</TableHead>
              <TableHead>Policy Number</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Client Email</TableHead>
              <TableHead>Agent Email</TableHead>
              <TableHead>Expiration Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPolicies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No policies found
                </TableCell>
              </TableRow>
            ) : (
              filteredPolicies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">{policy.customer_number}</TableCell>
                  <TableCell className="font-medium">{policy.policy_number}</TableCell>
                  <TableCell>{policy.client_first_name}</TableCell>
                  <TableCell>{policy.company_name}</TableCell>
                  <TableCell>{policy.client_email}</TableCell>
                  <TableCell>{policy.agent_email}</TableCell>
                  <TableCell>{format(new Date(policy.expiration_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>{getStatusBadge(policy)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getEmailStatus(policy.email1_sent, policy.email2_sent)}
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