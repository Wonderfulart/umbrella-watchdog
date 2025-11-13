-- Phase 2: Email Logs, Storage Policies, and User Management

-- 1. Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  email_type text NOT NULL CHECK (email_type IN ('email1', 'email2')),
  sent_at timestamp with time zone DEFAULT now() NOT NULL,
  recipient_email text NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message text,
  make_execution_id text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for email_logs
CREATE POLICY "Admins can view all email logs"
  ON public.email_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view logs for their policies"
  ON public.email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.policies
      WHERE policies.id = email_logs.policy_id
      AND policies.agent_email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage all email logs"
  ON public.email_logs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Add index for better query performance
CREATE INDEX idx_email_logs_policy_id ON public.email_logs(policy_id);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

-- 4. Add storage bucket RLS policies for email-assets
-- Admins can upload files
CREATE POLICY "Admins can upload to email-assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'email-assets'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Admins can update files
CREATE POLICY "Admins can update email-assets"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'email-assets'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Admins can delete files
CREATE POLICY "Admins can delete from email-assets"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'email-assets'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Everyone can view files (needed for email images)
CREATE POLICY "Public read access to email-assets"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'email-assets');