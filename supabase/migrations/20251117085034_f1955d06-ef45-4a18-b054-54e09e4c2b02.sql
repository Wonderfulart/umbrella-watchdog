-- Drop existing restrictive policies on policies table
DROP POLICY IF EXISTS "Admins full access to policies" ON public.policies;
DROP POLICY IF EXISTS "Agents view own policies" ON public.policies;

-- Add public access policy for SELECT
CREATE POLICY "Public can view all policies"
ON public.policies
FOR SELECT
USING (true);

-- Add admin-only policies for modifications
CREATE POLICY "Admins can insert policies"
ON public.policies
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update policies"
ON public.policies
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete policies"
ON public.policies
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));