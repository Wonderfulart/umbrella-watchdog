import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ImportPreviewProps {
  data: any[];
  columnMapping: Record<string, string>;
  onImport: () => void;
  onBack: () => void;
  importing: boolean;
}

export const ImportPreview = ({
  data,
  columnMapping,
  onImport,
  onBack,
  importing,
}: ImportPreviewProps) => {
  const previewData = data.slice(0, 10);

  const getMappedValue = (row: any, field: string) => {
    const columnName = columnMapping[field];
    return row[columnName] || "";
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Preview Import</h3>
        <p className="text-sm text-muted-foreground">
          Showing first 10 of {data.length} rows. Agents will be assigned in round-robin order.
        </p>
      </div>

      <div className="border rounded-lg overflow-auto max-h-96">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer #</TableHead>
              <TableHead>Policy #</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Company</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{getMappedValue(row, "customer_number")}</TableCell>
                <TableCell>{getMappedValue(row, "policy_number")}</TableCell>
                <TableCell>{getMappedValue(row, "client_first_name")}</TableCell>
                <TableCell>{getMappedValue(row, "client_email")}</TableCell>
                <TableCell>{getMappedValue(row, "expiration_date")}</TableCell>
                <TableCell>{getMappedValue(row, "company_name")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-semibold">Import Summary</span>
        </div>
        <div className="space-y-1 text-sm">
          <p>Total Rows: {data.length}</p>
          <p>Agents will be assigned automatically in rotation</p>
          <p>Duplicate policies (by policy number) will be skipped</p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={importing}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onImport} disabled={importing}>
          {importing ? "Importing..." : `Import ${data.length} Policies`}
        </Button>
      </div>
    </div>
  );
};
