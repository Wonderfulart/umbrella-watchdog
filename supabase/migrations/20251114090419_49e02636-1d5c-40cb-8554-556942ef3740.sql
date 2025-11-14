-- Create email templates table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('email1', 'email2')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create partial unique index for default templates
CREATE UNIQUE INDEX email_templates_default_unique 
ON public.email_templates (email_type) 
WHERE is_default = true;

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view templates"
ON public.email_templates
FOR SELECT
USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.email_templates (name, email_type, subject, body, is_default) VALUES
('Default Email 1', 'email1', 'Upcoming Policy Renewal - Action Required', 
'Dear {client_first_name},

This is a friendly reminder that your umbrella insurance policy is approaching its renewal date.

Policy Details:
- Policy Number: {policy_number}
- Customer Number: {customer_number}
- Expiration Date: {expiration_date}
- Company: {company_name}

To ensure continuous coverage, please complete your renewal application using the link below:
{submission_link}

If you have any questions or need assistance, please don''t hesitate to contact us.

Best regards,
{agent_first_name} {agent_last_name}
{company_name}', true),

('Default Email 2', 'email2', 'URGENT: Policy Expiring Soon - Immediate Action Required',
'Dear {client_first_name},

Your umbrella insurance policy is about to expire and requires immediate attention.

Policy Details:
- Policy Number: {policy_number}
- Customer Number: {customer_number}
- Expiration Date: {expiration_date}
- Company: {company_name}

⚠️ IMPORTANT: Your policy will expire soon. Please complete your renewal immediately to avoid any lapse in coverage.

Complete your renewal here:
{submission_link}

If you have already submitted your renewal, please disregard this message.

Urgent assistance? Contact us immediately.

Best regards,
{agent_first_name} {agent_last_name}
{company_name}', true);