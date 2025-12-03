import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  FileText, 
  RefreshCw, 
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EZLynxExportButton } from "./EZLynxExportButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FormSubmission {
  id: string;
  template_id: string | null;
  policy_id: string | null;
  submission_data: any;
  status: string | null;
  submitted_at: string | null;
  created_at: string | null;
  template?: {
    name: string;
    line_of_business: string[];
  } | null;
  policy?: {
    policy_number: string;
    client_first_name: string;
  } | null;
}

export const FormSubmissionsPanel = () => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("form_submissions")
        .select(`
          *,
          template:form_templates(name, line_of_business),
          policy:policies(policy_number, client_first_name)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Error",
        description: "Failed to load form submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "submitted":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="mr-1 h-3 w-3" />
            Submitted
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Draft
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Form Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Form Submissions
            </CardTitle>
            <CardDescription>
              View and export completed form submissions to EZLynx
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSubmissions}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No form submissions yet</p>
              <p className="text-sm">Submissions will appear here when clients complete forms</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Policy #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div className="font-medium">
                        {submission.template?.name || "Unknown Template"}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {submission.template?.line_of_business?.map((lob) => (
                          <Badge key={lob} variant="outline" className="text-xs">
                            {lob}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {submission.policy?.client_first_name || 
                       submission.submission_data?.applicant_first_name || 
                       "—"}
                    </TableCell>
                    <TableCell>
                      {submission.policy?.policy_number || "—"}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(submission.status)}
                    </TableCell>
                    <TableCell>
                      {formatDate(submission.submitted_at || submission.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <EZLynxExportButton 
                          submissionId={submission.id} 
                          variant="outline"
                          size="sm"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Submission Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedSubmission && (
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Template</p>
                    <p>{selectedSubmission.template?.name || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    {getStatusBadge(selectedSubmission.status)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Submitted At</p>
                    <p>{formatDate(selectedSubmission.submitted_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Policy Number</p>
                    <p>{selectedSubmission.policy?.policy_number || "—"}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Submission Data</p>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[300px]">
                    {JSON.stringify(selectedSubmission.submission_data, null, 2)}
                  </pre>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <EZLynxExportButton submissionId={selectedSubmission.id} />
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};