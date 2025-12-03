import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileCode, FileText, Loader2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  const handleExport = async (format: 'xml' | 'json') => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-ezlynx', {
        body: { submissionId, format },
      });

      if (error) throw error;

      if (format === 'xml') {
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
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('xml')}>
          <FileCode className="mr-2 h-4 w-4" />
          Download ACORD XML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileText className="mr-2 h-4 w-4" />
          View as JSON (Debug)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};