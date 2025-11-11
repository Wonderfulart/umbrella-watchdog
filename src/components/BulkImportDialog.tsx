import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { ColumnMapper } from "./ColumnMapper";
import { ImportPreview } from "./ImportPreview";
import { supabase } from "@/integrations/supabase/client";

interface ParsedRow {
  [key: string]: any;
}

export const BulkImportDialog = ({ onImportComplete }: { onImportComplete: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

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
    try {
      const { data, error } = await supabase.functions.invoke("bulk-import-policies", {
        body: { policies: parsedData, columnMapping },
      });

      if (error) throw error;

      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.imported} policies. ${data.skipped} duplicates skipped. ${data.errors.length} errors.`,
      });

      if (data.errors.length > 0) {
        console.error("Import errors:", data.errors);
      }

      setIsOpen(false);
      resetState();
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Policies</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="mb-4">Upload Excel or CSV file</p>
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
          </div>
        )}

        {step === "map" && (
          <ColumnMapper
            headers={headers}
            columnMapping={columnMapping}
            onMappingChange={setColumnMapping}
            onNext={() => setStep("preview")}
            onBack={() => setStep("upload")}
          />
        )}

        {step === "preview" && (
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
