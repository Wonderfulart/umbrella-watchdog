import { Button } from "@/components/ui/button";
import { Download, Mail, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { runPolicyReminder } from "@/services/policyReminderService";
import { useAuth } from "@/hooks/useAuth";

interface BulkActionsProps {
  selectedPolicies: string[];
  onActionComplete: () => void;
  onClearSelection: () => void;
}

export const BulkActions = ({
  selectedPolicies,
  onActionComplete,
  onClearSelection,
}: BulkActionsProps) => {
  const { isAdmin } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("policies")
        .delete()
        .in("id", selectedPolicies);

      if (error) throw error;

      toast.success(`Deleted ${selectedPolicies.length} policies`);
      setShowDeleteDialog(false);
      onClearSelection();
      onActionComplete();
    } catch (error: any) {
      console.error("Error deleting policies:", error);
      toast.error("Failed to delete policies");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkEmailTest = async () => {
    setIsTesting(true);
    try {
      const result = await runPolicyReminder();
      toast.success(`Test emails sent: ${result.first_emails_sent + result.followup_emails_sent}`);
      onActionComplete();
    } catch (error: any) {
      console.error("Error sending test emails:", error);
      toast.error("Failed to send test emails");
    } finally {
      setIsTesting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .in("id", selectedPolicies);

      if (error) throw error;

      // Convert to CSV
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers.map((header) => `"${row[header] || ""}"`).join(",")
        ),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `policies-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${selectedPolicies.length} policies to CSV`);
    } catch (error: any) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    }
  };

  if (selectedPolicies.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
        <span className="text-sm font-medium">
          {selectedPolicies.length} selected
        </span>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkEmailTest}
          disabled={isTesting}
          className="gap-2"
        >
          <Mail className="h-4 w-4" />
          Test Emails
        </Button>
        {isAdmin && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedPolicies.length} policies?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected policies and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
