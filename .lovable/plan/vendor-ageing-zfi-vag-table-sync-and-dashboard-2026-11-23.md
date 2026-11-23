# Vendor Ageing (ZFI_VAG) — table, sync and dashboard

## What you will get
- **Vendor Ageing screen** (Financial Accounting) replaces the "coming soon" page.
- **Filters** like the SAP screen: Key Date, Vendor from–to, Company Code from–to, Document Type from–to, Profit Center from–to, G/L Account from–to, plus Ageing basis (Due Date / Posting Date / GRN Date) and MSME. Filters start collapsed, with Clear/Reset.
- **Tiles**: Total Outstanding (₹ Cr), Not Due / 0–30, 31–90, 91–180, >1 year buckets, Vendors count, MSME outstanding.
- **Cards**: Ageing bucket chart (D10–D90 with the day labels from D1–D9), Top 10 Vendors, Outstanding by Company Code, by Profit Center (PRCTR_TEXT), by Segment, MSME vs Non‑MSME donut, by G/L Account (TXT50).
- **Detailed table** in full ₹ with search, pagination, Excel; PDF without filters/table; "Data available" + "Last Sync" beside Refresh (not in PDF).
- **Launchpad card**: Total Outstanding, Vendors, line count, Last Sync.
- **Data load**: your 52,373 rows from Vendor_Ageing.txt saved into the new table right away.

## SAP API Settings
New endpoint "Vendor_Ageing" — POST `/mis/zfi_vag/aging?sap-client=300`, payload exactly as you sent. S_KDATE = today (YYYYMMDD) on scheduled runs; R1/R2/R3 set from the Ageing basis (only one is "X"). Credentials are entered in SAP API Settings, not in code.

## Technical details
- Migration `public.vendor_ageing`: typed column for every response field (LIFNR, NAME1, J_1IPANNO, MINDK_DESC, BELNR, WRBTR, DAYS, BLART, BLDAT, D10–D90, BUKRS, PRCTR, SGTXT, GJAHR, BUDAT, T_VBELN, EBELN, BEDAT, HKONT, TXT50, UMSKZ, bank fields, SEGMENT/_TEXT, NET_DUE_DATE, PRCTR_TEXT, MSME fields, ZTERM, TEXT1, BUDAT_MKPF, LFBNR, BELNR1) + key_date, run_date, raw jsonb; "0000-00-00" → null. GRANTs, RLS on screen `fi.vendor-ageing` + profit-centre access; indexes on lifnr, bukrs, prctr.
- Sample data has no unique document key (49,436 unique BELNR for 52,373 lines), so each successful non-empty sync **replaces the whole snapshot** (staged then swapped atomically); an empty or failed reply never deletes data.
- Mapper `src/lib/vendor-ageing-map.ts`, data/helpers `src/lib/vendor-ageing-data.ts` (keyset paging, stable query, explicit Refresh), dashboard `src/components/vendor-ageing-dashboard.tsx`; routing in sap-pull.server.ts, scheduler.mjs, sync-core rebuild; mirror SQL in supabase/migrations; AGENTS.md rule; small vitest for bucket totals and R1/R2/R3 mapping.
