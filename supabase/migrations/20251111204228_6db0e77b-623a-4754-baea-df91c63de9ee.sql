-- Create automation_config table to store webhook URL
CREATE TABLE IF NOT EXISTS public.automation_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_url text NOT NULL,
  make_scenario_id text,
  make_connection_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access (since this is internal config)
CREATE POLICY "Allow public read access to automation_config"
  ON public.automation_config
  FOR SELECT
  USING (true);

-- Insert the webhook URL
INSERT INTO public.automation_config (webhook_url, make_scenario_id)
VALUES ('https://hook.us2.make.com/wxml33sjjwewwo2jbnkvyxmkm3eook7a', '1471864')
ON CONFLICT (id) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_automation_config_updated_at
  BEFORE UPDATE ON public.automation_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();