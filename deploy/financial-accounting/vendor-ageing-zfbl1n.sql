-- Financial Accounting: Vendor Ageing and ZFBL1N screens (safe to rerun).
INSERT INTO public.tile_groups (key, title, sort_order)
SELECT 'financial-accounting', 'Financial Accounting', 3
WHERE NOT EXISTS (SELECT 1 FROM public.tile_groups WHERE key = 'financial-accounting');

INSERT INTO public.tiles (group_key, title, subtitle, icon, kind, kpi_key, target_path, allowed_roles, sort_order, screen_key)
SELECT 'financial-accounting', v.title, v.sub, 'list', 'launch', v.kpi, v.path, ARRAY['admin','buyer','approver','viewer']::public.app_role[], v.so, v.sk
FROM (VALUES
  ('Vendor Ageing', 'Vendor outstanding by age', 'fi_vendor_ageing', '/reports/fi/vendor-ageing', 3, 'fi.vendor-ageing'),
  ('ZFBL1N', 'Vendor line items', 'fi_zfbl1n', '/reports/fi/zfbl1n', 4, 'fi.zfbl1n')
) AS v(title, sub, kpi, path, so, sk)
WHERE NOT EXISTS (SELECT 1 FROM public.tiles t WHERE t.screen_key = v.sk);

INSERT INTO public.role_screens (role_key, screen_key)
SELECT r.key, s.k FROM public.roles r
CROSS JOIN (VALUES ('fi.vendor-ageing'), ('fi.zfbl1n'), ('module.fi')) AS s(k)
WHERE r.key IN ('admin', 'super_admin')
ON CONFLICT DO NOTHING;
