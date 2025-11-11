-- Create policies table for tracking umbrella insurance renewals
CREATE TABLE IF NOT EXISTS public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_number TEXT NOT NULL UNIQUE,
  client_first_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  agent_email TEXT NOT NULL,
  expiration_date DATE NOT NULL,
  submission_link TEXT NOT NULL,
  jotform_submitted BOOLEAN DEFAULT FALSE,
  email1_sent BOOLEAN DEFAULT FALSE,
  email1_sent_date TIMESTAMPTZ,
  email2_sent BOOLEAN DEFAULT FALSE,
  email2_sent_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view policies (admin dashboard)
CREATE POLICY "Allow public read access to policies"
  ON public.policies
  FOR SELECT
  USING (true);

-- Create policy to allow inserting policies
CREATE POLICY "Allow public insert access to policies"
  ON public.policies
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow updating policies
CREATE POLICY "Allow public update access to policies"
  ON public.policies
  FOR UPDATE
  USING (true);

-- Create index for faster queries on expiration_date
CREATE INDEX idx_policies_expiration_date ON public.policies(expiration_date);

-- Create index for faster queries on policy_number
CREATE INDEX idx_policies_policy_number ON public.policies(policy_number);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();