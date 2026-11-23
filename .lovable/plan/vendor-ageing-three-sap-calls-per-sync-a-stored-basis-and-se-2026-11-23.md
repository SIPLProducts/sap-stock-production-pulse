# Vendor Ageing: three SAP calls per sync, a stored basis, and searchable filters

This replaces the earlier idea of dropping R1/R2/R3. Each sync now asks SAP for all three ageing bases, one after another.

## 1. Each sync calls SAP three times
On the Sync button and on scheduled syncs:
1. Call 1 sends **R1 = "X"**, R2 = "", R3 = "" (Due Date).
2. Call 2 sends R1 = "", **R2 = "X"**, R3 = "" (Posting Date).
3. Call 3 sends R1 = "", R2 = "", **R3 = "X"** (GRN Date).

- All other payload fields are sent as saved in SAP API Settings. S_KDATE stays today's date.
- Rows from all three replies are saved together as one new copy of the data. The old data is replaced only after all three calls succeed. If any call fails, the existing data stays as it was and the error is logged.
- The sync log shows the row count for each basis.

## 2. New column: Profit Center Text
- A new **Profit Center Text** column is saved on every Vendor Ageing row. It holds "Due Date", "Posting Date" or "GRN Date", depending on which call returned the row.
- Data already saved has no value here until the next sync.

## 3. Vendor Ageing screen
- **Filters:** the "Profit Center Text" section (All / Due Date / Posting Date / GRN Date) now filters on this saved column, so the tiles, charts and table show the rows SAP returned for that basis. The default is Due Date, so totals aren't counted three times. "All" shows every row.
- **Table and Excel:** a Profit Center Text column is added.
- **Search in every dropdown:** each filter dropdown (Vendor, Company Code, Doc Type, Profit Center, G/L, MSME and the rest) gets a search box at the top. Typing narrows the list.

## Technical
- Migration (mirrored in `supabase/migrations` and `deploy/financial-accounting`): `ALTER TABLE public.vendor_ageing ADD COLUMN pc_text text` plus an index.
- `vendor-ageing-map.ts`: add `vendorAgeingPayloads(raw, now)`, which returns three payloads (R1, R2, R3 in turn), and have `mapVendorAgeingPayload` accept a basis label for `pc_text`.
- `sap-pull.server.ts`: for Vendor Ageing, loop over the three payloads through the existing SAP call, collect the rows under one `synced_at`, insert them, then delete older snapshots. Mirror this in `middleware/sync-core.mjs` and `middleware/scheduler.mjs`.
- `vendor-ageing-data.ts` and the dashboard: read `pc_text`, change the basis radio to filter by `pc_text` instead of re-bucketing (default Due Date), and add the table and Excel column.
- `filter-multi-select.tsx`: add a search input at the top of the list. This shared component is used by all screens, so every filter dropdown gets search.
- Tests: three payloads with exactly one X each; rows tagged with the right basis; basis filter counts.
- For Quality and Production, run the migration, copy `sync-core.mjs` and `scheduler.mjs`, restart, and upload the build.
