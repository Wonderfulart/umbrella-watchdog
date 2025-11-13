-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'agent');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles (admins can manage)
CREATE POLICY "Admins can manage user roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Update policies table RLS
DROP POLICY IF EXISTS "Allow public read access to policies" ON public.policies;
DROP POLICY IF EXISTS "Allow public insert access to policies" ON public.policies;
DROP POLICY IF EXISTS "Allow public update access to policies" ON public.policies;

-- Admins can do everything on policies
CREATE POLICY "Admins full access to policies"
  ON public.policies
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Agents can only see their assigned policies
CREATE POLICY "Agents view own policies"
  ON public.policies
  FOR SELECT
  TO authenticated
  USING (
    agent_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Update agents table RLS
DROP POLICY IF EXISTS "Allow public read access to agents" ON public.agents;
DROP POLICY IF EXISTS "Allow public insert access to agents" ON public.agents;
DROP POLICY IF EXISTS "Allow public update access to agents" ON public.agents;
DROP POLICY IF EXISTS "Allow public delete access to agents" ON public.agents;

-- Admins can manage agents
CREATE POLICY "Admins manage agents"
  ON public.agents
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Agents can view their own info
CREATE POLICY "Agents view own info"
  ON public.agents
  FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Update automation_config RLS
DROP POLICY IF EXISTS "Allow public read access to automation_config" ON public.automation_config;

-- Only admins can access automation config
CREATE POLICY "Admins manage automation config"
  ON public.automation_config
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));