import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Search, CheckCircle2, XCircle } from "lucide-react";

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

interface EmailActivityTableProps {
  policies: Policy[];
  filter: string;
}

export const EmailActivityTable = ({ policies, filter }: EmailActivityTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch = 
      policy.customer_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.client_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.client_email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case "email1":
        return policy.email1_sent;
      case "email2":
        return policy.email2_sent;
      case "none":
        return !policy.email1_sent && !policy.email2_sent;
      case "both":
        return policy.email1_sent && policy.email2_sent;
      default:
        return true;
    }
  });

  const formatEmailStatus = (sent: boolean, date: string | null) => {
    if (!sent || !date) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <XCircle className="h-4 w-4" />
          <span>Not Sent</span>
        </div>
      );
    }

    const sentDate = new Date(date);
    const daysAgo = Math.floor((Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24));

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">Sent</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {format(sentDate, "MMM d, yyyy 'at' h:mm a")}
        </div>
        <div className="text-xs text-muted-foreground">
          {daysAgo === 0 ? "Today" : `${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer #, policy #, name, company, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer #</TableHead>
              <TableHead>Policy #</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Client Email</TableHead>
              <TableHead>Expiration Date</TableHead>
              <TableHead>Email 1 Status</TableHead>
              <TableHead>Email 2 Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPolicies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No policies found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredPolicies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">{policy.customer_number}</TableCell>
                  <TableCell>{policy.policy_number}</TableCell>
                  <TableCell>{policy.client_first_name}</TableCell>
                  <TableCell>{policy.client_email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {format(new Date(policy.expiration_date), "MMM d, yyyy")}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatEmailStatus(policy.email1_sent, policy.email1_sent_date)}</TableCell>
                  <TableCell>{formatEmailStatus(policy.email2_sent, policy.email2_sent_date)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
