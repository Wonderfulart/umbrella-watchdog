import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmailTemplate {
  id: string;
  name: string;
  email_type: string;
  subject: string;
  body: string;
  is_default: boolean;
}

interface EmailTemplateToggleProps {
  selectedTemplate: string;
  onTemplateChange: (templateType: string) => void;
}

export const EmailTemplateToggle = ({ 
  selectedTemplate, 
  onTemplateChange 
}: EmailTemplateToggleProps) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("email_type");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Email Template Selection</Label>
      </div>
      
      <RadioGroup
        value={selectedTemplate}
        onValueChange={onTemplateChange}
        className="grid gap-3"
      >
        {templates.map((template) => (
          <label
            key={template.id}
            className={`cursor-pointer rounded-lg border p-4 transition-all hover:bg-accent/50 ${
              selectedTemplate === template.email_type 
                ? "border-primary bg-primary/5 ring-1 ring-primary" 
                : "border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value={template.email_type} className="mt-1" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{template.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {template.email_type === "email1" ? "First Email" : "Follow-up"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  Subject: {template.subject}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {template.body.substring(0, 120)}...
                </p>
              </div>
            </div>
          </label>
        ))}
      </RadioGroup>

      <p className="text-xs text-muted-foreground mt-2">
        The selected template determines which email format is used for automated reminders.
      </p>
    </div>
  );
};