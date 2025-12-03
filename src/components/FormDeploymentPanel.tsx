import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, ExternalLink, Eye, Loader2, ClipboardCopy, Download } from "lucide-react";
import { useFormTemplate } from "@/hooks/useFormTemplate";
import { MasterFormBuilder } from "./forms/MasterFormBuilder";
import { InsuranceApplicationForm } from "./forms/InsuranceApplicationForm";
import { FormSubmissionsPanel } from "./FormSubmissionsPanel";
import { toast } from "@/hooks/use-toast";

interface FormDeploymentPanelProps {
  policies?: Array<{ id: string; policy_number: string; client_first_name: string }>;
}

export function FormDeploymentPanel({ policies = [] }: FormDeploymentPanelProps) {
  const { templates, loading, fetchTemplates } = useFormTemplate();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('');
  const [showFormPreview, setShowFormPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');

  const handleTemplateCreated = async (templateId: string) => {
    await fetchTemplates();
    setSelectedTemplateId(templateId);
    toast({
      title: "Form Created",
      description: "You can now preview and deploy the form."
    });
  };

  const copyFormLink = () => {
    if (!selectedTemplateId) return;
    
    const baseUrl = window.location.origin;
    const formUrl = `${baseUrl}/form/${selectedTemplateId}${selectedPolicyId ? `?policy=${selectedPolicyId}` : ''}`;
    
    navigator.clipboard.writeText(formUrl);
    toast({
      title: "Link Copied",
      description: "Form link has been copied to clipboard."
    });
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Form Templates</TabsTrigger>
          <TabsTrigger value="submissions" className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            Submissions
          </TabsTrigger>
          <TabsTrigger value="create">Create New Form</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Deploy Insurance Application
              </CardTitle>
              <CardDescription>
                Select a form template and optionally link it to a policy for pre-population.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No form templates found</p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Master Form
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Form Template</label>
                      <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a form template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                {template.name}
                                {template.is_master && (
                                  <Badge variant="secondary" className="text-xs">Master</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Link to Policy (Optional)</label>
                      <Select value={selectedPolicyId} onValueChange={(val) => setSelectedPolicyId(val === 'none' ? '' : val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a policy to pre-fill" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No policy selected</SelectItem>
                          {policies.map((policy) => (
                            <SelectItem key={policy.id} value={policy.id}>
                              {policy.policy_number} - {policy.client_first_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedTemplate && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{selectedTemplate.name}</h4>
                          {selectedTemplate.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedTemplate.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {selectedTemplate.line_of_business.map(lob => (
                            <Badge key={lob} variant="outline" className="capitalize">
                              {lob}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowFormPreview(true)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview Form
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={copyFormLink}
                        >
                          <ClipboardCopy className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => {
                            const baseUrl = window.location.origin;
                            window.open(`${baseUrl}/form/${selectedTemplateId}`, '_blank');
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Form
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Templates List */}
          {templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div 
                      key={template.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTemplateId === template.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{template.name}</span>
                          {template.is_master && (
                            <Badge variant="secondary" className="text-xs">Master</Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {template.line_of_business.map(lob => (
                            <Badge key={lob} variant="outline" className="text-xs capitalize">
                              {lob}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="submissions">
          <FormSubmissionsPanel />
        </TabsContent>

        <TabsContent value="create">
          <MasterFormBuilder onTemplateCreated={handleTemplateCreated} />
        </TabsContent>
      </Tabs>

      {/* Form Preview Dialog */}
      <Dialog open={showFormPreview} onOpenChange={setShowFormPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
          </DialogHeader>
          {selectedTemplateId && (
            <InsuranceApplicationForm
              templateId={selectedTemplateId}
              policyId={selectedPolicyId || undefined}
              onSubmit={() => {
                setShowFormPreview(false);
                toast({
                  title: "Application Submitted",
                  description: "The insurance application has been submitted."
                });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
