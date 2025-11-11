import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploadZone } from "./FileUploadZone";
import { FileList } from "./FileList";
import { useToast } from "@/hooks/use-toast";

interface FileItem {
  name: string;
  publicUrl: string;
}

export const StorageUploader = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("email-assets")
        .list();

      if (error) throw error;

      const filesWithUrls = (data || []).map((file) => {
        const { data: urlData } = supabase.storage
          .from("email-assets")
          .getPublicUrl(file.name);
        
        return {
          name: file.name,
          publicUrl: urlData.publicUrl,
        };
      });

      setFiles(filesWithUrls);
    } catch (error: any) {
      console.error("Error fetching files:", error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from("email-assets")
        .remove([fileName]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "File deleted successfully",
      });

      fetchFiles();
      window.location.reload(); // Refresh to update setup guide
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Images</CardTitle>
          <CardDescription>
            Upload images to storage and get public URLs for use in emails and templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploadZone onUploadComplete={fetchFiles} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
          <CardDescription>
            Manage your uploaded files and copy public URLs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading files...
            </div>
          ) : (
            <FileList files={files} onDelete={handleDelete} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
