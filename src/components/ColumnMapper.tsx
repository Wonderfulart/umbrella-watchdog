import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

const REQUIRED_FIELDS = [
  { key: "customer_number", label: "Customer Number *" },
  { key: "policy_number", label: "Policy Number *" },
  { key: "client_first_name", label: "Client First Name *" },
  { key: "client_email", label: "Client Email *" },
  { key: "agent_email", label: "Agent Email *" },
  { key: "expiration_date", label: "Expiration Date *" },
];

interface ColumnMapperProps {
  headers: string[];
  columnMapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ColumnMapper = ({ headers, columnMapping, onMappingChange, onNext, onBack }: ColumnMapperProps) => {
  const autoDetectMapping = () => {
    const newMapping: Record<string, string> = {};

    REQUIRED_FIELDS.forEach(({ key }) => {
      const possibleMatches = headers.filter((header) => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
        const normalizedKey = key.toLowerCase().replace(/_/g, "");
        return normalizedHeader.includes(normalizedKey) || normalizedKey.includes(normalizedHeader);
      });

      if (possibleMatches.length > 0) {
        newMapping[key] = possibleMatches[0];
      }
    });

    onMappingChange(newMapping);
  };

  const handleMappingChange = (field: string, header: string) => {
    onMappingChange({ ...columnMapping, [field]: header });
  };

  const isValid = REQUIRED_FIELDS.every(({ key }) => columnMapping[key]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Map Columns</h3>
        <Button variant="outline" onClick={autoDetectMapping}>
          Auto-Detect
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Map your spreadsheet columns to the required fields. Fields marked with * are required.
      </p>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {REQUIRED_FIELDS.map(({ key, label }) => (
          <div key={key} className="grid grid-cols-2 gap-4 items-center">
            <Label>{label}</Label>
            <Select value={columnMapping[key] || ""} onValueChange={(value) => handleMappingChange(key, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {headers.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
