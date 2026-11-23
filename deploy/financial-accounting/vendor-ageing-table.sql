CREATE TABLE public.vendor_ageing (
  id bigserial PRIMARY KEY,
  key_date date, run_date date,
  lifnr text, name1 text, j_1ipanno text, mindk_desc text, belnr text, wrbtr numeric, days integer, blart text, bldat date,
  d10 numeric, d20 numeric, d30 numeric, d40 numeric, d50 numeric, d60 numeric, d70 numeric, d80 numeric, d90 numeric,
  bukrs text, prctr text, sgtxt text, gjahr integer, budat date, t_vbeln text, ebeln text, bedat date, hkont text, txt50 text, umskz text,
  ifsc text, bankn text, banka text, koinh text, segment text, segment_text text, net_due_date date, prctr_text text,
  msme_no text, cert_id text, status text, valid_from date, valid_to date, reg_city text, main_cert text, zterm text, text1 text,
  budat_mkpf date, lfbnr text, belnr1 text,
  raw jsonb, source_endpoint text, synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vendor_ageing_lifnr_idx ON public.vendor_ageing (lifnr);
CREATE INDEX vendor_ageing_bukrs_idx ON public.vendor_ageing (bukrs);
CREATE INDEX vendor_ageing_prctr_idx ON public.vendor_ageing (prctr);
CREATE INDEX vendor_ageing_synced_idx ON public.vendor_ageing (synced_at);
GRANT SELECT ON public.vendor_ageing TO authenticated;
GRANT ALL ON public.vendor_ageing TO service_role;
GRANT USAGE ON SEQUENCE public.vendor_ageing_id_seq TO service_role;
ALTER TABLE public.vendor_ageing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendor ageing visible by access" ON public.vendor_ageing FOR SELECT TO authenticated
USING ((SELECT public.has_screen(auth.uid(), 'fi.vendor-ageing')) AND ((SELECT public.current_access_unrestricted()) OR coalesce(prctr, '') = ANY ((SELECT public.current_access_profit_centers())::text[])));

INSERT INTO public.sap_endpoints (name, module_key, description, endpoint_path, http_method, body_template, response_root, posting_range)
SELECT 'Vendor_Ageing', 'financial-accounting', 'ZFI_VAG vendor ageing (open items by key date)', '/mis/zfi_vag/aging?sap-client=300', 'POST',
'{"S_KDATE":"","VENDOR_FROM":[],"VENDOR_TO":[],"BUKRS_FROM":[],"BUKRS_TO":[],"BLART_FROM":[],"BLART_TO":[],"PRCTR_FROM":[],"PRCTR_TO":[],"HKONT_FROM":[],"HKONT_TO":[],"MSME":"","D1":"30","D2":"90","D3":"120","D4":"180","D6":"366","D7":"732","D8":"1097","D9":"1827","R1":"X","R2":"","R3":""}',
'DATA', 'custom'
WHERE NOT EXISTS (SELECT 1 FROM public.sap_endpoints WHERE name = 'Vendor_Ageing');