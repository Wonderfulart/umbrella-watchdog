import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Download, FileCode, FileText, Loader2, ChevronDown, Mail, Cloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface EZLynxExportButtonProps {
  submissionId: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export const EZLynxExportButton = ({ 
  submissionId, 
  disabled = false,
  variant = "outline",
  size = "default"
}: EZLynxExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleExport = async (format: 'xml' | 'json' | 'pdf', emailToAgent = false) => {
    setIsExporting(true);
    try {
      const body: any = { submissionId, format };
      
      if (emailToAgent && user?.email) {
        body.emailToAgent = true;
        body.agentEmail = user.email;
      }

      const { data, error } = await supabase.functions.invoke('export-ezlynx', {
        body,
      });

      if (error) throw error;

      if (format === 'pdf' && emailToAgent) {
        // Handle email response
        toast({
          title: data.success ? "Email Sent" : "Email Failed",
          description: data.message,
          variant: data.success ? "default" : "destructive",
        });
      } else if (format === 'pdf') {
        // For PDF download, the response is binary
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ACORD_Application_${submissionId.substring(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Export Successful",
          description: "ACORD PDF has been downloaded",
        });
      } else if (format === 'xml') {
        // For XML, trigger download
        const blob = new Blob([data.xml || data], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ACORD_Export_${submissionId.substring(0, 8)}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Export Successful",
          description: "ACORD XML file has been downloaded",
        });
      } else {
        // For JSON, show in console and notify
        console.log('EZLynx Export Data:', data);
        toast({
          title: "Export Complete",
          description: "Check browser console for export data",
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export submission",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={disabled || isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export to EZLynx
              <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="mr-2 h-4 w-4" />
          Download ACORD PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('xml')}>
          <FileCode className="mr-2 h-4 w-4" />
          Download ACORD XML
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleExport('pdf', true)}
          disabled={!user?.email}
        >
          <Mail className="mr-2 h-4 w-4" />
          Email PDF to Me
          {!user?.email && <span className="ml-auto text-xs text-muted-foreground">(Login required)</span>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="opacity-60">
          <Cloud className="mr-2 h-4 w-4" />
          Direct to EZLynx API
          <Badge variant="outline" className="ml-auto text-xs">Coming Soon</Badge>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('json')} className="text-muted-foreground">
          <FileText className="mr-2 h-4 w-4" />
          View as JSON (Debug)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
