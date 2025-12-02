-- Fix security issue: Remove public access to automation_config
DROP POLICY IF EXISTS "Allow public read access to automation_config" ON automation_config;

-- This policy already exists and is correct, but ensuring it's the only one
-- Admins manage automation config 
-- (policy should already exist from earlier migrations)