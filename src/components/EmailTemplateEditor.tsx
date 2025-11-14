import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Eye, Save, Plus, Info, Copy, Sparkles } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  email_type: 'email1' | 'email2';
  subject: string;
  body: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function EmailTemplateEditor() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [emailType, setEmailType] = useState<'email1' | 'email2'>('email1');
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const mergeFields = [
    { field: '{client_first_name}', description: "Client's first name" },
    { field: '{customer_number}', description: 'Customer number' },
    { field: '{policy_number}', description: 'Policy number' },
    { field: '{expiration_date}', description: 'Policy expiration date' },
    { field: '{company_name}', description: 'Company name' },
    { field: '{submission_link}', description: 'JotForm submission link' },
    { field: '{agent_first_name}', description: "Agent's first name" },
    { field: '{agent_last_name}', description: "Agent's last name" },
    { field: '{client_email}', description: "Client's email address" },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as EmailTemplate[]);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
    setSubject(template.subject);
    setBody(template.body);
    setEmailType(template.email_type);
    setIsCreating(false);
  };

  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setName('');
    setSubject('');
    setBody('');
    setEmailType('email1');
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!name || !subject || !body) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isCreating) {
        const { error } = await supabase.from('email_templates').insert([
          {
            name,
            email_type: emailType,
            subject,
            body,
            is_default: false,
          },
        ]);

        if (error) throw error;
        toast.success('Template created successfully');
      } else if (selectedTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            name,
            subject,
            body,
          })
          .eq('id', selectedTemplate.id);

        if (error) throw error;
        toast.success('Template updated successfully');
      }

      await fetchTemplates();
      setIsCreating(false);
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (templateId: string, emailType: 'email1' | 'email2') => {
    setLoading(true);
    try {
      // First, unset any existing default for this email type
      await supabase
        .from('email_templates')
        .update({ is_default: false })
        .eq('email_type', emailType)
        .eq('is_default', true);

      // Then set the new default
      const { error } = await supabase
        .from('email_templates')
        .update({ is_default: true })
        .eq('id', templateId);

      if (error) throw error;

      toast.success('Default template updated');
      await fetchTemplates();
    } catch (error: any) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default template');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const previewTemplate = () => {
    const sampleData = {
      '{client_first_name}': 'John',
      '{customer_number}': 'CUST-12345',
      '{policy_number}': 'POL-67890',
      '{expiration_date}': '2025-12-31',
      '{company_name}': 'Sample Insurance Co.',
      '{submission_link}': 'https://form.jotform.com/example',
      '{agent_first_name}': 'Jane',
      '{agent_last_name}': 'Smith',
      '{client_email}': 'john@example.com',
    };

    let previewBody = body;
    Object.entries(sampleData).forEach(([key, value]) => {
      previewBody = previewBody.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return previewBody;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">Customize your email reminders</p>
        </div>
        <Button onClick={handleNewTemplate} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Select a template to edit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{template.name}</span>
                  {template.is_default && (
                    <Badge variant="default" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {template.email_type === 'email1' ? 'Email 1' : 'Email 2'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {isCreating ? 'Create New Template' : 'Edit Template'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="help">Merge Fields</TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    placeholder="My Custom Template"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {isCreating && (
                  <div className="space-y-2">
                    <Label htmlFor="email-type">Email Type</Label>
                    <Select value={emailType} onValueChange={(value: 'email1' | 'email2') => setEmailType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email1">Email 1 (37 days before)</SelectItem>
                        <SelectItem value="email2">Email 2 (After expiration)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    placeholder="Your Policy Renewal Reminder"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Email Body</Label>
                  <Textarea
                    id="body"
                    placeholder="Enter your email content here..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Template'}
                  </Button>
                  {selectedTemplate && !selectedTemplate.is_default && (
                    <Button
                      variant="outline"
                      onClick={() => handleSetDefault(selectedTemplate.id, selectedTemplate.email_type)}
                      disabled={loading}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Set as Default
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertTitle>Preview with Sample Data</AlertTitle>
                  <AlertDescription>
                    This shows how your email will look with actual data
                  </AlertDescription>
                </Alert>
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Subject:</Label>
                    <p className="font-semibold">{subject || 'No subject'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Body:</Label>
                    <div className="whitespace-pre-wrap text-sm">{previewTemplate() || 'No content'}</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="help" className="mt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Available Merge Fields</AlertTitle>
                  <AlertDescription>
                    Use these fields in your subject and body. They will be replaced with actual data when emails are sent.
                  </AlertDescription>
                </Alert>
                <div className="mt-4 space-y-2">
                  {mergeFields.map((field) => (
                    <div
                      key={field.field}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <code className="text-sm font-mono font-semibold">{field.field}</code>
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(field.field)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
