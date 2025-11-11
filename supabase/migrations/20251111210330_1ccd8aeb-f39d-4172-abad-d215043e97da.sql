-- Create agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  company_logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on agents table
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to agents
CREATE POLICY "Allow public read access to agents"
ON public.agents
FOR SELECT
USING (true);

-- Create policy for public insert access to agents
CREATE POLICY "Allow public insert access to agents"
ON public.agents
FOR INSERT
WITH CHECK (true);

-- Create policy for public update access to agents
CREATE POLICY "Allow public update access to agents"
ON public.agents
FOR UPDATE
USING (true);

-- Create policy for public delete access to agents
CREATE POLICY "Allow public delete access to agents"
ON public.agents
FOR DELETE
USING (true);

-- Add agent fields to policies table
ALTER TABLE public.policies
ADD COLUMN IF NOT EXISTS agent_first_name text,
ADD COLUMN IF NOT EXISTS agent_last_name text,
ADD COLUMN IF NOT EXISTS agent_company_logo_url text;

-- Add last_assigned_agent_index to automation_config table
ALTER TABLE public.automation_config
ADD COLUMN IF NOT EXISTS last_assigned_agent_index integer DEFAULT 0;

-- Insert 3 sample agents
INSERT INTO public.agents (first_name, last_name, email, company_logo_url, is_active)
VALUES 
  ('John', 'Smith', 'john.smith@insurance.com', 'https://placeholder.svg', true),
  ('Sarah', 'Johnson', 'sarah.johnson@insurance.com', 'https://placeholder.svg', true),
  ('Michael', 'Williams', 'michael.williams@insurance.com', 'https://placeholder.svg', true)
ON CONFLICT (email) DO NOTHING;