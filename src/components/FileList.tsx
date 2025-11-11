import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FileItem {
  name: string;
  publicUrl: string;
}

interface FileListProps {
  files: FileItem[];
  onDelete: (fileName: string) => void;
}

export const FileList = ({ files, onDelete }: FileListProps) => {
  const { toast } = useToast();

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied",
      description: "URL copied to clipboard",
    });
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No files uploaded yet
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">Preview</TableHead>
          <TableHead>Filename</TableHead>
          <TableHead>Public URL</TableHead>
          <TableHead className="w-24 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <TableRow key={file.name}>
            <TableCell>
              <img
                src={file.publicUrl}
                alt={file.name}
                className="h-10 w-10 object-cover rounded"
              />
            </TableCell>
            <TableCell className="font-medium">{file.name}</TableCell>
            <TableCell className="max-w-xs truncate text-muted-foreground">
              {file.publicUrl}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(file.publicUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(file.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
