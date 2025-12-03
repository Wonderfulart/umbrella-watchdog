import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FormTemplate, FormSection, FormField } from "@/types/insuranceForm";
import { toast } from "@/hooks/use-toast";

export function useFormTemplate(templateId?: string) {
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our types
      const typedTemplates: FormTemplate[] = (data || []).map(t => ({
        ...t,
        line_of_business: t.line_of_business as FormTemplate['line_of_business'],
      }));
      
      setTemplates(typedTemplates);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error loading templates",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch single template with sections and fields
  const fetchTemplate = async (id: string) => {
    try {
      setLoading(true);
      
      // Fetch template
      const { data: templateData, error: templateError } = await supabase
        .from('form_templates')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (templateError) throw templateError;
      if (!templateData) {
        setTemplate(null);
        return;
      }

      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('form_sections')
        .select('*')
        .eq('template_id', id)
        .order('sort_order');

      if (sectionsError) throw sectionsError;

      // Fetch fields for all sections
      const sectionIds = sectionsData?.map(s => s.id) || [];
      let fieldsData: any[] = [];
      
      if (sectionIds.length > 0) {
        const { data: fields, error: fieldsError } = await supabase
          .from('form_fields')
          .select('*')
          .in('section_id', sectionIds)
          .order('sort_order');

        if (fieldsError) throw fieldsError;
        fieldsData = fields || [];
      }

      // Combine data
      const sections: FormSection[] = (sectionsData || []).map(section => ({
        ...section,
        line_of_business: section.line_of_business as FormSection['line_of_business'],
        fields: fieldsData
          .filter(f => f.section_id === section.id)
          .map(f => ({
            ...f,
            field_type: f.field_type as FormField['field_type'],
            line_of_business: f.line_of_business as FormField['line_of_business'],
            options: f.options || [],
            validation_rules: f.validation_rules || {},
          }))
      }));

      const fullTemplate: FormTemplate = {
        ...templateData,
        line_of_business: templateData.line_of_business as FormTemplate['line_of_business'],
        sections
      };

      setTemplate(fullTemplate);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error loading template",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new template
  const createTemplate = async (data: Partial<FormTemplate>) => {
    try {
      const { data: newTemplate, error } = await supabase
        .from('form_templates')
        .insert([data as any])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Template created",
        description: "Form template has been created successfully."
      });
      
      return newTemplate;
    } catch (err: any) {
      toast({
        title: "Error creating template",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  // Create section
  const createSection = async (data: Partial<FormSection>) => {
    try {
      const { data: newSection, error } = await supabase
        .from('form_sections')
        .insert([data as any])
        .select()
        .single();

      if (error) throw error;
      return newSection;
    } catch (err: any) {
      toast({
        title: "Error creating section",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  // Create field
  const createField = async (data: Partial<FormField>) => {
    try {
      const { data: newField, error } = await supabase
        .from('form_fields')
        .insert([data as any])
        .select()
        .single();

      if (error) throw error;
      return newField;
    } catch (err: any) {
      toast({
        title: "Error creating field",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  // Bulk create fields
  const createFields = async (fields: Partial<FormField>[]) => {
    try {
      const { data: newFields, error } = await supabase
        .from('form_fields')
        .insert(fields as any)
        .select();

      if (error) throw error;
      return newFields;
    } catch (err: any) {
      toast({
        title: "Error creating fields",
        description: err.message,
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    if (templateId) {
      fetchTemplate(templateId);
    } else {
      fetchTemplates();
    }
  }, [templateId]);

  return {
    template,
    templates,
    loading,
    error,
    fetchTemplates,
    fetchTemplate,
    createTemplate,
    createSection,
    createField,
    createFields,
  };
}
