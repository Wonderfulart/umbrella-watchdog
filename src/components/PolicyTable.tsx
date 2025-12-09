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
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Check, X } from "lucide-react";
import { BulkActions } from "@/components/BulkActions";
import { PolicyRowActions } from "@/components/PolicyRowActions";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  agent_first_name?: string;
  agent_last_name?: string;
  agent_company_logo_url?: string;
}

interface PolicyTableProps {
  policies: Policy[];
  onRefresh?: () => void;
}

export const PolicyTable = ({ policies, onRefresh }: PolicyTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPolicies = filteredPolicies.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedPolicies([]);
  };

  const toggleSelectAll = () => {
    if (selectedPolicies.length === paginatedPolicies.length && paginatedPolicies.length > 0) {
      setSelectedPolicies([]);
    } else {
      setSelectedPolicies(paginatedPolicies.map((p) => p.id));
    }
  };

  const toggleSelectPolicy = (policyId: string) => {
    setSelectedPolicies((prev) =>
      prev.includes(policyId)
        ? prev.filter((id) => id !== policyId)
        : [...prev, policyId]
    );
  };

  const handleActionComplete = () => {
    setSelectedPolicies([]);
    onRefresh?.();
  };

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

      <BulkActions
        selectedPolicies={selectedPolicies}
        onActionComplete={handleActionComplete}
        onClearSelection={() => setSelectedPolicies([])}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedPolicies.length === paginatedPolicies.length && paginatedPolicies.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Customer #</TableHead>
              <TableHead>Policy Number</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Client Email</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Expiration Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email Status</TableHead>
              <TableHead>Form Submitted</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPolicies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground">
                  No policies found
                </TableCell>
              </TableRow>
            ) : (
              paginatedPolicies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedPolicies.includes(policy.id)}
                      onCheckedChange={() => toggleSelectPolicy(policy.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{policy.customer_number}</TableCell>
                  <TableCell className="font-medium">{policy.policy_number}</TableCell>
                  <TableCell>{policy.client_first_name}</TableCell>
                  <TableCell>{policy.company_name}</TableCell>
                  <TableCell>{policy.client_email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {policy.agent_company_logo_url && (
                        <img src={policy.agent_company_logo_url} alt="Logo" className="h-6 w-6 object-contain" />
                      )}
                      <span>
                        {policy.agent_first_name && policy.agent_last_name
                          ? `${policy.agent_first_name} ${policy.agent_last_name}`
                          : policy.agent_email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(policy.expiration_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>{getStatusBadge(policy)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getEmailStatus(policy.email1_sent, policy.email2_sent)}
                  </TableCell>
                  <TableCell>
                    {policy.jotform_submitted ? (
                      <Badge className="bg-success text-success-foreground">
                        <Check className="h-3 w-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <X className="h-3 w-3 mr-1" />
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <PolicyRowActions policy={policy} onActionComplete={handleActionComplete} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => handlePageChange(i + 1)}
                  isActive={currentPage === i + 1}
                  className="cursor-pointer"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};