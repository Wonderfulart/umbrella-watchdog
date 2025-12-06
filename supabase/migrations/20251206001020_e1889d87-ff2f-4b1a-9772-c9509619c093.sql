-- Remove public access to policies table
DROP POLICY IF EXISTS "Public can view all policies" ON public.policies;

-- Add policy for authenticated agents to view policies assigned to them
CREATE POLICY "Agents can view assigned policies" 
ON public.policies 
FOR SELECT 
TO authenticated
USING (
  agent_email = (SELECT email FROM profiles WHERE id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Remove public access to email templates (no longer needed with auth enabled)
DROP POLICY IF EXISTS "Allow public read access to email templates" ON public.email_templates;