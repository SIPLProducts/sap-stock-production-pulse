ALTER TABLE public.vendor_ageing ADD COLUMN IF NOT EXISTS pc_text text;
CREATE INDEX IF NOT EXISTS vendor_ageing_pc_text_idx ON public.vendor_ageing (pc_text);