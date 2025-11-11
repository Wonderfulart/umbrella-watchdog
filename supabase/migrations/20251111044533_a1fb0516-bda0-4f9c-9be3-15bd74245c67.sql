-- Add customer_number and company_name columns to policies table
ALTER TABLE public.policies 
ADD COLUMN customer_number text NOT NULL DEFAULT '',
ADD COLUMN company_name text NOT NULL DEFAULT '';

-- Remove the default constraints after adding the columns
ALTER TABLE public.policies 
ALTER COLUMN customer_number DROP DEFAULT,
ALTER COLUMN company_name DROP DEFAULT;