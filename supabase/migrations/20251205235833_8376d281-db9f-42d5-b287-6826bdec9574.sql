-- Allow public read access to email templates (since auth is removed)
CREATE POLICY "Allow public read access to email templates" 
ON public.email_templates
FOR SELECT
USING (true);