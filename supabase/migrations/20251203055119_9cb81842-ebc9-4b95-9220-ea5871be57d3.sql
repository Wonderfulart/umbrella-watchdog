-- Create enum for line of business
CREATE TYPE public.line_of_business AS ENUM ('auto', 'home', 'dwelling', 'commercial');

-- Create enum for field types
CREATE TYPE public.form_field_type AS ENUM ('text', 'select', 'date', 'checkbox', 'textarea', 'number', 'phone', 'email', 'ssn', 'vin', 'currency', 'radio', 'multiselect');

-- Form Templates table
CREATE TABLE public.form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  line_of_business line_of_business[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_master BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Form Sections table
CREATE TABLE public.form_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.form_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  line_of_business line_of_business[] DEFAULT '{}',
  is_collapsible BOOLEAN DEFAULT true,
  is_expanded_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Form Fields table
CREATE TABLE public.form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES public.form_sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type form_field_type NOT NULL DEFAULT 'text',
  ezlynx_mapping TEXT,
  placeholder TEXT,
  help_text TEXT,
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  line_of_business line_of_business[] DEFAULT '{}',
  options JSONB DEFAULT '[]',
  validation_rules JSONB DEFAULT '{}',
  conditional_logic JSONB,
  default_value TEXT,
  grid_cols INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Form Submissions table
CREATE TABLE public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.form_templates(id),
  policy_id UUID REFERENCES public.policies(id),
  submission_data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_templates
CREATE POLICY "Authenticated users can view active templates"
ON public.form_templates FOR SELECT
USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins can manage templates"
ON public.form_templates FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for form_sections
CREATE POLICY "Authenticated users can view sections"
ON public.form_sections FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage sections"
ON public.form_sections FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for form_fields
CREATE POLICY "Authenticated users can view fields"
ON public.form_fields FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage fields"
ON public.form_fields FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for form_submissions
CREATE POLICY "Users can view own submissions"
ON public.form_submissions FOR SELECT
USING (submitted_by = auth.uid());

CREATE POLICY "Admins can view all submissions"
ON public.form_submissions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create submissions"
ON public.form_submissions FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own draft submissions"
ON public.form_submissions FOR UPDATE
USING (submitted_by = auth.uid() AND status = 'draft');

CREATE POLICY "Admins can manage all submissions"
ON public.form_submissions FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_form_sections_template ON public.form_sections(template_id);
CREATE INDEX idx_form_fields_section ON public.form_fields(section_id);
CREATE INDEX idx_form_submissions_template ON public.form_submissions(template_id);
CREATE INDEX idx_form_submissions_policy ON public.form_submissions(policy_id);

-- Update trigger for timestamps
CREATE TRIGGER update_form_templates_updated_at
BEFORE UPDATE ON public.form_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_submissions_updated_at
BEFORE UPDATE ON public.form_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();