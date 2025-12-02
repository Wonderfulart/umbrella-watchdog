-- Fix RLS policy that's trying to access auth.users (causes permission denied error)
-- Drop the problematic policy
DROP POLICY IF EXISTS "Agents can view logs for their policies" ON email_logs;

-- Create corrected policy that uses profiles table instead of auth.users
CREATE POLICY "Agents can view logs for their policies" 
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM policies p
      INNER JOIN profiles prof ON prof.email = p.agent_email
      WHERE p.id = email_logs.policy_id 
        AND prof.id = auth.uid()
    )
  );