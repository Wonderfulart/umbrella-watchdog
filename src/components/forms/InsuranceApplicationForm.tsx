import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Save, FileText } from "lucide-react";
import { FormSectionRenderer } from "./FormSectionRenderer";
import { useFormTemplate } from "@/hooks/useFormTemplate";
import { FormTemplate, LineOfBusiness } from "@/types/insuranceForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface InsuranceApplicationFormProps {
  templateId: string;
  policyId?: string;
  initialData?: Record<string, any>;
  onSubmit?: (data: Record<string, any>) => void;
  onSaveDraft?: (data: Record<string, any>) => void;
}

export function InsuranceApplicationForm({
  templateId,
  policyId,
  initialData = {},
  onSubmit,
  onSaveDraft
}: InsuranceApplicationFormProps) {
  const { template, loading } = useFormTemplate(templateId);
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedLOB, setSelectedLOB] = useState<LineOfBusiness[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setSelectedLOB(template.line_of_business);
    }
  }, [template]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, ...initialData }));
  }, [initialData]);

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is updated
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const toggleLOB = (lob: LineOfBusiness) => {
    setSelectedLOB(prev => 
      prev.includes(lob) 
        ? prev.filter(l => l !== lob)
        : [...prev, lob]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    template?.sections?.forEach(section => {
      // Skip sections not relevant to selected LOB
      if (section.line_of_business?.length > 0 && 
          !section.line_of_business.some(lob => selectedLOB.includes(lob))) {
        return;
      }

      section.fields?.forEach(field => {
        // Skip fields not relevant to selected LOB
        if (field.line_of_business?.length > 0 && 
            !field.line_of_business.some(lob => selectedLOB.includes(lob))) {
          return;
        }

        if (field.is_required && !formData[field.name]) {
          newErrors[field.name] = `${field.label} is required`;
        }

        // Additional validation based on rules
        const value = formData[field.name];
        if (value && field.validation_rules) {
          if (field.validation_rules.minLength && String(value).length < field.validation_rules.minLength) {
            newErrors[field.name] = `Minimum ${field.validation_rules.minLength} characters required`;
          }
          if (field.validation_rules.maxLength && String(value).length > field.validation_rules.maxLength) {
            newErrors[field.name] = `Maximum ${field.validation_rules.maxLength} characters allowed`;
          }
          if (field.validation_rules.pattern) {
            const regex = new RegExp(field.validation_rules.pattern);
            if (!regex.test(String(value))) {
              newErrors[field.name] = field.validation_rules.patternMessage || 'Invalid format';
            }
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);

      // Save to database
      const { data, error } = await supabase
        .from('form_submissions')
        .insert([{
          template_id: templateId,
          policy_id: policyId,
          submission_data: formData,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your insurance application has been submitted successfully."
      });

      onSubmit?.(formData);
    } catch (err: any) {
      toast({
        title: "Submission Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('form_submissions')
        .insert([{
          template_id: templateId,
          policy_id: policyId,
          submission_data: formData,
          status: 'draft'
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Draft Saved",
        description: "Your application has been saved as a draft."
      });

      onSaveDraft?.(formData);
    } catch (err: any) {
      toast({
        title: "Save Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!template) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Form template not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{template.name}</CardTitle>
          {template.description && (
            <CardDescription>{template.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label className="text-sm font-medium">Line of Business</Label>
            <div className="flex flex-wrap gap-4">
              {(['auto', 'home', 'dwelling', 'commercial'] as LineOfBusiness[]).map((lob) => (
                <div key={lob} className="flex items-center space-x-2">
                  <Checkbox
                    id={`lob-${lob}`}
                    checked={selectedLOB.includes(lob)}
                    onCheckedChange={() => toggleLOB(lob)}
                  />
                  <Label htmlFor={`lob-${lob}`} className="font-normal cursor-pointer capitalize">
                    {lob === 'auto' ? 'Personal Auto' : 
                     lob === 'home' ? 'Homeowner' :
                     lob === 'dwelling' ? 'Dwelling Fire' : 'Commercial'}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              {selectedLOB.map(lob => (
                <Badge key={lob} variant="secondary" className="capitalize">
                  {lob}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Sections */}
      {template.sections
        ?.filter(section => {
          if (!section.line_of_business || section.line_of_business.length === 0) {
            return true;
          }
          return section.line_of_business.some(lob => selectedLOB.includes(lob));
        })
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((section) => (
          <FormSectionRenderer
            key={section.id}
            section={section}
            values={formData}
            onChange={handleFieldChange}
            errors={errors}
            selectedLOB={selectedLOB}
          />
        ))}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={saving || submitting}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || saving || selectedLOB.length === 0}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit Application
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
