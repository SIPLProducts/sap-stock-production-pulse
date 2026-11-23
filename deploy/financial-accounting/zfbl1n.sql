-- ZFBL1N vendor line items: typed snapshot table, access-scoped RLS and fast summary/page RPCs.
CREATE TABLE IF NOT EXISTS public.zfbl1n_items (
  id bigserial PRIMARY KEY,
  bukrs text, gjahr integer, belnr text, buzei integer, blart text, bschl text, bstat text,
  budat date, bldat date, faedt date, augbl text, augdt date,
  lifnr text, name1 text, prctr text, hkont text, txt50 text, gsber text, umskz text, koart text, shkzg text,
  dmshb numeric NOT NULL DEFAULT 0, wrshb numeric, waers text, hwaer text, verzn integer,
  xblnr text, zuonr text, sgtxt text, ebeln text, kostl text, werks text, ktext text, monat integer, jamon text,
  source_endpoint text, synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS zfbl1n_budat_idx ON public.zfbl1n_items (budat);
CREATE INDEX IF NOT EXISTS zfbl1n_bukrs_idx ON public.zfbl1n_items (bukrs);
CREATE INDEX IF NOT EXISTS zfbl1n_lifnr_idx ON public.zfbl1n_items (lifnr);
CREATE INDEX IF NOT EXISTS zfbl1n_prctr_idx ON public.zfbl1n_items (prctr);
CREATE INDEX IF NOT EXISTS zfbl1n_synced_idx ON public.zfbl1n_items (synced_at);
GRANT SELECT ON public.zfbl1n_items TO authenticated;
GRANT ALL ON public.zfbl1n_items TO service_role;
GRANT USAGE ON SEQUENCE public.zfbl1n_items_id_seq TO service_role;
ALTER TABLE public.zfbl1n_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ZFBL1N visible by access" ON public.zfbl1n_items;
CREATE POLICY "ZFBL1N visible by access" ON public.zfbl1n_items FOR SELECT TO authenticated
USING ((SELECT public.has_screen(auth.uid(), 'fi.zfbl1n')) AND ((SELECT public.current_access_unrestricted()) OR coalesce(prctr, '') = ANY ((SELECT public.current_access_profit_centers())::text[])));

-- Rows matching the screen filters (runs as the caller, so RLS applies).
CREATE OR REPLACE FUNCTION public.zfbl1n_filtered(_f jsonb)
RETURNS SETOF public.zfbl1n_items LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT i.* FROM public.zfbl1n_items i
  WHERE (coalesce(_f->>'vendor_from','') = '' OR i.lifnr >= _f->>'vendor_from')
    AND (coalesce(_f->>'vendor_to','') = '' OR i.lifnr <= _f->>'vendor_to')
    AND (coalesce(_f->>'bukrs_from','') = '' OR i.bukrs >= _f->>'bukrs_from')
    AND (coalesce(_f->>'bukrs_to','') = '' OR i.bukrs <= _f->>'bukrs_to')
    AND (coalesce(_f->>'prctr_from','') = '' OR i.prctr >= _f->>'prctr_from')
    AND (coalesce(_f->>'prctr_to','') = '' OR i.prctr <= _f->>'prctr_to')
    AND (coalesce(_f->>'post_from','') = '' OR i.budat >= (_f->>'post_from')::date)
    AND (coalesce(_f->>'post_to','') = '' OR i.budat <= (_f->>'post_to')::date)
    AND CASE coalesce(_f->>'status','all')
      WHEN 'open' THEN (coalesce(_f->>'key_date','') = '' AND coalesce(i.augbl,'') = '')
        OR (coalesce(_f->>'key_date','') <> '' AND (i.budat IS NULL OR i.budat <= (_f->>'key_date')::date) AND (coalesce(i.augbl,'') = '' OR i.augdt > (_f->>'key_date')::date))
      WHEN 'cleared' THEN coalesce(i.augbl,'') <> ''
      ELSE true END
    AND (jsonb_typeof(_f->'types') IS DISTINCT FROM 'array' OR jsonb_array_length(_f->'types') = 0 OR (
         ((_f->'types') ? 'normal' AND coalesce(i.umskz,'') = '' AND coalesce(i.bstat,'') NOT IN ('S','V') AND coalesce(i.koart,'K') = 'K')
      OR ((_f->'types') ? 'special' AND coalesce(i.umskz,'') <> '' AND coalesce(i.bstat,'') NOT IN ('S','V'))
      OR ((_f->'types') ? 'noted' AND i.bstat = 'S')
      OR ((_f->'types') ? 'parked' AND i.bstat = 'V')
      OR ((_f->'types') ? 'customer' AND i.koart = 'D')));
$$;

CREATE OR REPLACE FUNCTION public.zfbl1n_summary(_f jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public AS $$
  WITH r AS (SELECT * FROM public.zfbl1n_filtered(coalesce(_f,'{}'::jsonb))),
  g AS (SELECT abs(dmshb) AS v, * FROM r)
  SELECT jsonb_build_object(
    'net', coalesce((SELECT sum(dmshb) FROM r),0),
    'debit', coalesce((SELECT sum(dmshb) FROM r WHERE dmshb > 0),0),
    'credit', coalesce((SELECT -sum(dmshb) FROM r WHERE dmshb < 0),0),
    'overdue', coalesce((SELECT sum(v) FROM g WHERE coalesce(verzn,0) > 0),0),
    'notDue', coalesce((SELECT sum(v) FROM g WHERE coalesce(verzn,0) <= 0),0),
    'vendors', (SELECT count(DISTINCT lifnr) FROM r),
    'lines', (SELECT count(*) FROM r),
    'minDate', (SELECT min(budat) FROM r), 'maxDate', (SELECT max(budat) FROM r),
    'lastSync', (SELECT max(synced_at) FROM public.zfbl1n_items),
    'buckets', (SELECT jsonb_agg(jsonb_build_object('name', b, 'value', s) ORDER BY o) FROM (
       SELECT CASE WHEN coalesce(verzn,0) <= 30 THEN '0-30' WHEN verzn <= 90 THEN '31-90' WHEN verzn <= 180 THEN '91-180' WHEN verzn <= 365 THEN '181-365' ELSE '>1 Yr' END b,
              min(CASE WHEN coalesce(verzn,0) <= 30 THEN 1 WHEN verzn <= 90 THEN 2 WHEN verzn <= 180 THEN 3 WHEN verzn <= 365 THEN 4 ELSE 5 END) o, sum(v) s FROM g GROUP BY 1) x),
    'docTypes', (SELECT jsonb_agg(jsonb_build_object('name', k, 'value', s) ORDER BY s DESC) FROM (SELECT coalesce(nullif(blart,''),'—') k, sum(v) s FROM g GROUP BY 1) x),
    'vendorsTop', (SELECT jsonb_agg(jsonb_build_object('name', k, 'value', s) ORDER BY s DESC) FROM (SELECT coalesce(nullif(max(name1),''), lifnr) k, sum(v) s FROM g WHERE coalesce(lifnr,'') <> '' GROUP BY lifnr ORDER BY 2 DESC LIMIT 10) x),
    'pcTop', (SELECT jsonb_agg(jsonb_build_object('name', k, 'value', s) ORDER BY s DESC) FROM (SELECT prctr k, sum(v) s FROM g WHERE coalesce(prctr,'') <> '' GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x),
    'glTop', (SELECT jsonb_agg(jsonb_build_object('name', k, 'value', s) ORDER BY s DESC) FROM (SELECT coalesce(nullif(max(txt50),''), hkont) k, sum(v) s FROM g WHERE coalesce(hkont,'') <> '' GROUP BY hkont ORDER BY 2 DESC LIMIT 10) x),
    'company', (SELECT jsonb_agg(jsonb_build_object('name', k, 'value', s) ORDER BY s DESC) FROM (SELECT bukrs k, sum(v) s FROM g WHERE coalesce(bukrs,'') <> '' GROUP BY 1) x),
    'months', (SELECT jsonb_agg(jsonb_build_object('name', k, 'value', s) ORDER BY k) FROM (SELECT to_char(budat,'YYYY-MM') k, sum(v) s FROM g WHERE budat IS NOT NULL GROUP BY 1 ORDER BY 1 DESC LIMIT 24) x)
  );
$$;

CREATE OR REPLACE FUNCTION public.zfbl1n_page(_f jsonb DEFAULT '{}'::jsonb, _search text DEFAULT '', _offset integer DEFAULT 0, _limit integer DEFAULT 50)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public AS $$
  WITH r AS (SELECT * FROM public.zfbl1n_filtered(coalesce(_f,'{}'::jsonb)) i
    WHERE coalesce(_search,'') = '' OR concat_ws(' ', i.lifnr, i.name1, i.belnr, i.blart, i.bukrs, i.prctr, i.hkont, i.txt50, i.zuonr, i.xblnr, i.sgtxt, i.augbl) ILIKE '%' || _search || '%')
  SELECT jsonb_build_object('total', (SELECT count(*) FROM r), 'sum', coalesce((SELECT sum(dmshb) FROM r),0),
    'rows', coalesce((SELECT jsonb_agg(to_jsonb(p)) FROM (SELECT bukrs, lifnr, name1, belnr, buzei, blart, budat, bldat, faedt, verzn, dmshb, waers, prctr, hkont, txt50, zuonr, sgtxt, augbl, augdt
      FROM r ORDER BY budat DESC NULLS LAST, belnr, buzei OFFSET greatest(_offset,0) LIMIT least(greatest(_limit,1), 100000)) p), '[]'::jsonb));
$$;

CREATE OR REPLACE FUNCTION public.zfbl1n_options()
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT jsonb_build_object(
    'vendors', coalesce((SELECT jsonb_agg(jsonb_build_object('value', lifnr, 'label', lifnr || coalesce(' - ' || nullif(n,''), '')) ORDER BY lifnr) FROM (SELECT lifnr, max(name1) n FROM public.zfbl1n_items WHERE coalesce(lifnr,'') <> '' GROUP BY lifnr) x), '[]'),
    'bukrs', coalesce((SELECT jsonb_agg(jsonb_build_object('value', bukrs, 'label', bukrs) ORDER BY bukrs) FROM (SELECT DISTINCT bukrs FROM public.zfbl1n_items WHERE coalesce(bukrs,'') <> '') x), '[]'),
    'prctr', coalesce((SELECT jsonb_agg(jsonb_build_object('value', prctr, 'label', prctr) ORDER BY prctr) FROM (SELECT DISTINCT prctr FROM public.zfbl1n_items WHERE coalesce(prctr,'') <> '') x), '[]'));
$$;
GRANT EXECUTE ON FUNCTION public.zfbl1n_filtered(jsonb), public.zfbl1n_summary(jsonb), public.zfbl1n_page(jsonb, text, integer, integer), public.zfbl1n_options() TO authenticated;

INSERT INTO public.sap_endpoints (name, module_key, description, endpoint_path, http_method, body_template, response_root, posting_range)
SELECT 'ZFBL1N', 'financial-accounting', 'ZFBL1N vendor line items', '/mis/zfbl1n/items?sap-client=300', 'POST',
'{"VENDOR_ACCOUNT_FROM":"","VENDOR_ACCOUNT_TO":"","COMPANY_CODE_FROM":"","COMPANY_CODE_TO":"","SEARCH_HELP_ID":"","SEARCH_STRING":"","PROFIT_CENTER_FROM":"","PROFIT_CENTER_TO":"","OPEN_ITEMS":"X","CLEARED_ITEMS":"","ALL_ITEMS":"","OPEN_AT_KEY_DATE":"","CLEARING_DATE_FROM":"","CLEARING_DATE_TO":"","CLEARED_OPEN_AT_KEY_DATE":"","POSTING_DATE_FROM":"","POSTING_DATE_TO":"","NORMAL_ITEMS":"X","SPECIAL_GL_TRANSACTIONS":"","NOTED_ITEMS":"","PARKED_ITEMS":"","CUSTOMER_ITEMS":"","LAYOUT":"","MAXIMUM_NUMBER_OF_ITEMS":""}',
'items', 'custom'
WHERE NOT EXISTS (SELECT 1 FROM public.sap_endpoints WHERE name = 'ZFBL1N');
