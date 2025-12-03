-- Update existing email templates with new content
UPDATE public.email_templates 
SET 
  name = 'First Renewal Reminder',
  subject = 'Action Required: Your Umbrella Policy {{policy_number}} Renewal',
  body = 'Dear {{client_first_name}},

We are transitioning our annual umbrella review questionnaires to a new format. Please see the link below for your umbrella renewal. We want to make sure we have the most up to date information.

Policy Number: {{policy_number}}
Expiration Date: {{expiration_date}}

Submission Link: {{submission_link}}

If you prefer, please call our office to talk to an agent.

Best regards,
{{agent_first_name}} {{agent_last_name}}',
  updated_at = now()
WHERE email_type = 'email1';

UPDATE public.email_templates 
SET 
  name = 'Follow-up Reminder',
  subject = 'Reminder: Your Umbrella Policy {{policy_number}} Needs Attention',
  body = 'Dear {{client_first_name}},

We are transitioning our annual umbrella review questionnaires to a new format. Please see the link below for your umbrella renewal. We want to make sure we have the most up to date information.

Policy Number: {{policy_number}}
Expiration Date: {{expiration_date}}

Submission Link: {{submission_link}}

If you prefer, please call our office to talk to an agent.

Best regards,
{{agent_first_name}} {{agent_last_name}}',
  updated_at = now()
WHERE email_type = 'email2';

-- Create social_posts table for social media hub
CREATE TABLE IF NOT EXISTS public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create social_post_results table
CREATE TABLE IF NOT EXISTS public.social_post_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  external_post_id TEXT,
  error_message TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create social_settings table for storing webhook URLs
CREATE TABLE IF NOT EXISTS public.social_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zapier_webhook_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for social_posts
CREATE POLICY "Admins can manage all social posts" ON public.social_posts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own social posts" ON public.social_posts
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create social posts" ON public.social_posts
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own social posts" ON public.social_posts
  FOR UPDATE USING (created_by = auth.uid());

-- RLS Policies for social_post_results
CREATE POLICY "Admins can view all social post results" ON public.social_post_results
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view results of own posts" ON public.social_post_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.social_posts 
      WHERE social_posts.id = social_post_results.post_id 
      AND social_posts.created_by = auth.uid()
    )
  );

-- RLS Policies for social_settings
CREATE POLICY "Admins can manage social settings" ON public.social_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_settings_updated_at
  BEFORE UPDATE ON public.social_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();