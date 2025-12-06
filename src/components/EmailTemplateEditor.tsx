import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Mail, Save, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  email_type: string;
  is_default: boolean;
}

export const EmailTemplateEditor = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("email_type", { ascending: true });

      if (error) throw error;

      setTemplates(data || []);
      if (data && data.length > 0) {
        setActiveTemplate(data[0]);
      }
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activeTemplate) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("email_templates")
        .update({
          subject: activeTemplate.subject,
          body: activeTemplate.body,
          name: activeTemplate.name,
        })
        .eq("id", activeTemplate.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email template saved successfully",
      });

      fetchTemplates();
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save email template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateActiveTemplate = (field: keyof EmailTemplate, value: string) => {
    if (!activeTemplate) return;
    setActiveTemplate({ ...activeTemplate, [field]: value });
  };

  const renderPreview = () => {
    if (!activeTemplate) return null;

    const previewData = {
      client_first_name: "John",
      policy_number: "POL-12345",
      expiration_date: "December 31, 2025",
      submission_link: "https://example.com/submit",
      agent_first_name: "Jane",
      agent_last_name: "Smith",
      company_name: "ABC Insurance",
    };

    let preview = activeTemplate.body;
    Object.entries(previewData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, "g"), value);
    });

    return (
      <div
        className="prose max-w-none p-6 bg-background border rounded-lg"
        dangerouslySetInnerHTML={{ __html: preview }}
      />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading templates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Template Editor
        </CardTitle>
        <CardDescription>
          Customize email templates used for policy reminders. Use variables like{" "}
          <code className="text-xs">{"{{client_first_name}}"}</code>,{" "}
          <code className="text-xs">{"{{policy_number}}"}</code>,{" "}
          <code className="text-xs">{"{{expiration_date}}"}</code>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTemplate?.email_type}
          onValueChange={(value) => {
            const template = templates.find((t) => t.email_type === value);
            if (template) setActiveTemplate(template);
          }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email1">First Reminder</TabsTrigger>
            <TabsTrigger value="email2">Follow-up Reminder</TabsTrigger>
          </TabsList>

          {templates.map((template) => (
            <TabsContent key={template.id} value={template.email_type} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={activeTemplate?.name || ""}
                  onChange={(e) => updateActiveTemplate("name", e.target.value)}
                  placeholder="Template name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={activeTemplate?.subject || ""}
                  onChange={(e) => updateActiveTemplate("subject", e.target.value)}
                  placeholder="Email subject line"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Email Body (HTML supported)</Label>
                <Textarea
                  id="body"
                  value={activeTemplate?.body || ""}
                  onChange={(e) => updateActiveTemplate("body", e.target.value)}
                  placeholder="Email body with HTML and variables"
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Template"}
                </Button>

                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Email Preview</DialogTitle>
                      <DialogDescription>
                        Preview with sample data
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Subject:</Label>
                        <p className="text-sm font-medium mt-1">{activeTemplate?.subject}</p>
                      </div>
                      {renderPreview()}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="p-4 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-2">Available Variables:</p>
                <div className="grid grid-cols-2 gap-2">
                  <code>{"{{client_first_name}}"}</code>
                  <code>{"{{policy_number}}"}</code>
                  <code>{"{{expiration_date}}"}</code>
                  <code>{"{{submission_link}}"}</code>
                  <code>{"{{agent_first_name}}"}</code>
                  <code>{"{{agent_last_name}}"}</code>
                  <code>{"{{company_name}}"}</code>
                  <code>{"{{customer_number}}"}</code>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
