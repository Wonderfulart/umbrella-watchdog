import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Users, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { ColumnMapper } from "./ColumnMapper";
import { ImportPreview } from "./ImportPreview";
import { supabase } from "@/integrations/supabase/client";

interface ParsedRow {
  [key: string]: any;
}

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
}

export const BulkImportDialog = ({ onImportComplete }: { onImportComplete: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
  const [importing, setImporting] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [nextAgentIndex, setNextAgentIndex] = useState(0);
  const [updateMode, setUpdateMode] = useState(false);
  const [importResults, setImportResults] = useState<{ 
    imported: number; 
    updated: number;
    skipped: number;
    agentAssignments: Record<string, number> 
  } | null>(null);
  const { toast } = useToast();

  // Fetch agents and round-robin index when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchAgentsAndConfig();
    }
  }, [isOpen]);

  const fetchAgentsAndConfig = async () => {
    try {
      // Fetch active agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

      if (agentsError) throw agentsError;
      setAgents(agentsData || []);

      // Fetch current round-robin index
      const { data: configData, error: configError } = await supabase
        .from('automation_config')
        .select('last_assigned_agent_index')
        .limit(1)
        .maybeSingle();

      if (!configError && configData) {
        setNextAgentIndex(configData.last_assigned_agent_index || 0);
      }
    } catch (error) {
      console.error('Error fetching agents/config:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const fileExtension = uploadedFile.name.split(".").pop()?.toLowerCase();

    if (fileExtension === "csv") {
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedData(results.data as ParsedRow[]);
          setHeaders(results.meta.fields || []);
          setStep("map");
        },
        error: (error) => {
          toast({
            title: "Error parsing CSV",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet) as ParsedRow[];
          
          if (jsonData.length > 0) {
            setParsedData(jsonData);
            setHeaders(Object.keys(jsonData[0]));
            setStep("map");
          }
        } catch (error: any) {
          toast({
            title: "Error parsing Excel",
            description: error.message,
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV, XLS, or XLSX file",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setImportResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("bulk-import-policies", {
        body: { policies: parsedData, columnMapping, updateMode },
      });

      if (error) throw error;

      // Calculate agent assignments for display
      const agentAssignments: Record<string, number> = {};
      if (agents.length > 0 && data.imported > 0) {
        let tempIndex = nextAgentIndex;
        for (let i = 0; i < data.imported; i++) {
          const agent = agents[tempIndex % agents.length];
          const agentName = `${agent.first_name} ${agent.last_name}`;
          agentAssignments[agentName] = (agentAssignments[agentName] || 0) + 1;
          tempIndex++;
        }
      }

      setImportResults({ 
        imported: data.imported, 
        updated: data.updated || 0,
        skipped: data.skipped || 0,
        agentAssignments 
      });

      const parts = [];
      if (data.imported > 0) parts.push(`${data.imported} imported`);
      if (data.updated > 0) parts.push(`${data.updated} updated`);
      if (data.skipped > 0) parts.push(`${data.skipped} skipped`);
      if (data.errors?.length > 0) parts.push(`${data.errors.length} errors`);

      toast({
        title: "Import Complete",
        description: parts.join(", "),
      });

      if (data.errors?.length > 0) {
        console.error("Import errors:", data.errors);
      }

      // Refresh agents config for next import
      fetchAgentsAndConfig();
      onImportComplete();
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setColumnMapping({});
    setStep("upload");
    setImportResults(null);
    setUpdateMode(false);
  };

  const getNextAgent = (): Agent | null => {
    if (agents.length === 0) return null;
    return agents[nextAgentIndex % agents.length];
  };

  const nextAgent = getNextAgent();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Policies from Eclipse</DialogTitle>
        </DialogHeader>

        {/* Round-Robin Agent Assignment Info */}
        {agents.length > 0 && !importResults && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Round-Robin Agent Assignment</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Policies will be assigned starting with:{" "}
              <span className="font-medium text-foreground">
                {nextAgent ? `${nextAgent.first_name} ${nextAgent.last_name}` : 'No active agents'}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {agents.length} active agent{agents.length !== 1 ? 's' : ''} in rotation: {agents.map(a => `${a.first_name} ${a.last_name}`).join(' → ')}
            </p>
          </div>
        )}

        {/* Import Results Summary */}
        {importResults && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              Import Complete
            </h4>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
              {importResults.imported > 0 && (
                <p>✓ {importResults.imported} new {importResults.imported === 1 ? 'policy' : 'policies'} imported</p>
              )}
              {importResults.updated > 0 && (
                <p>✓ {importResults.updated} existing {importResults.updated === 1 ? 'policy' : 'policies'} updated</p>
              )}
              {importResults.skipped > 0 && (
                <p className="text-muted-foreground">○ {importResults.skipped} {importResults.skipped === 1 ? 'duplicate' : 'duplicates'} skipped</p>
              )}
            </div>
            {Object.keys(importResults.agentAssignments).length > 0 && (
              <div className="text-sm text-green-700 dark:text-green-300 mt-3">
                <p className="font-medium mb-1">Agent Assignments (new policies):</p>
                <ul className="list-disc list-inside">
                  {Object.entries(importResults.agentAssignments).map(([agent, count]) => (
                    <li key={agent}>{agent}: {count} {count === 1 ? 'policy' : 'policies'}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => {
                resetState();
                setIsOpen(false);
              }}
            >
              Close
            </Button>
          </div>
        )}

        {step === "upload" && !importResults && (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="mb-4">Upload Excel or CSV file from Eclipse</p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild variant="outline">
                  <span>Choose File</span>
                </Button>
              </label>
              {file && <p className="mt-2 text-sm text-muted-foreground">{file.name}</p>}
            </div>

            {/* Update Mode Toggle */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/30">
              <Checkbox 
                id="update-mode" 
                checked={updateMode}
                onCheckedChange={(checked) => setUpdateMode(checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="update-mode" className="flex items-center gap-2 cursor-pointer">
                  <RefreshCw className="h-4 w-4" />
                  Update existing policies
                </Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, policies with matching policy numbers will be updated instead of skipped. 
                  New policies will still be imported normally.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "map" && !importResults && (
          <ColumnMapper
            headers={headers}
            columnMapping={columnMapping}
            onMappingChange={setColumnMapping}
            onNext={() => setStep("preview")}
            onBack={() => setStep("upload")}
          />
        )}

        {step === "preview" && !importResults && (
          <ImportPreview
            data={parsedData}
            columnMapping={columnMapping}
            onImport={handleImport}
            onBack={() => setStep("map")}
            importing={importing}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
