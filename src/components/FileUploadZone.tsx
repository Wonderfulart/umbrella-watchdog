import { Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadZoneProps {
  onUploadComplete: () => void;
}

export const FileUploadZone = ({ onUploadComplete }: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPG, PNG, GIF, WEBP, SVG)",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        
        const { error } = await supabase.storage
          .from("email-assets")
          .upload(file.name, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
        
        onUploadComplete();
        window.location.reload(); // Refresh to update setup guide
      } catch (error: any) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload file",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [toast, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border bg-card"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">
          {isUploading ? "Uploading..." : "Drag & Drop Images Here"}
        </p>
        <p className="text-sm text-muted-foreground mb-2">or click to browse files</p>
        <p className="text-xs text-muted-foreground">
          Supports: JPG, PNG, GIF, WEBP, SVG (Max 5MB)
        </p>
      </label>
    </div>
  );
};
