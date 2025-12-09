import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Copy, 
  CheckCircle, 
  XCircle,
  Mail,
  ExternalLink 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EditPolicyDialog } from "./EditPolicyDialog";

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

interface PolicyRowActionsProps {
  policy: Policy;
  onActionComplete: () => void;
}

export const PolicyRowActions = ({ policy, onActionComplete }: PolicyRowActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("policies")
        .delete()
        .eq("id", policy.id);

      if (error) throw error;

      toast.success("Policy deleted successfully");
      setShowDeleteDialog(false);
      onActionComplete();
    } catch (error: any) {
      console.error("Error deleting policy:", error);
      toast.error(error.message || "Failed to delete policy");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(policy.submission_link);
    toast.success("Submission link copied to clipboard");
  };

  const handleToggleFormSubmitted = async () => {
    try {
      const { error } = await supabase
        .from("policies")
        .update({ jotform_submitted: !policy.jotform_submitted })
        .eq("id", policy.id);

      if (error) throw error;

      toast.success(
        policy.jotform_submitted 
          ? "Marked as not submitted" 
          : "Marked as submitted"
      );
      onActionComplete();
    } catch (error: any) {
      console.error("Error updating policy:", error);
      toast.error(error.message || "Failed to update policy");
    }
  };

  const handleResetEmailStatus = async () => {
    try {
      const { error } = await supabase
        .from("policies")
        .update({ 
          email1_sent: false, 
          email1_sent_date: null,
          email2_sent: false,
          email2_sent_date: null 
        })
        .eq("id", policy.id);

      if (error) throw error;

      toast.success("Email status reset");
      onActionComplete();
    } catch (error: any) {
      console.error("Error resetting email status:", error);
      toast.error(error.message || "Failed to reset email status");
    }
  };

  const handleOpenLink = () => {
    window.open(policy.submission_link, "_blank");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Policy
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Form Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenLink}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Form Link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleToggleFormSubmitted}>
            {policy.jotform_submitted ? (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Mark as Not Submitted
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Submitted
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResetEmailStatus}>
            <Mail className="mr-2 h-4 w-4" />
            Reset Email Status
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Policy
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete policy <strong>{policy.policy_number}</strong> for{" "}
              <strong>{policy.client_first_name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditPolicyDialog
        policy={policy}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onPolicyUpdated={onActionComplete}
      />
    </>
  );
};
