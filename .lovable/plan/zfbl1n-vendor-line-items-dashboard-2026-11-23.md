# ZFBL1N – Vendor Line Items dashboard

Build the real ZFBL1N screen (Financial Accounting) and its launchpad card from the SAP vendor line-item API, the same way Vendor Ageing was built, with fast loading.

## Filters (collapsed by default, like other screens)
- **Vendor account** (from–to pick-list, vendor code + name)
- **Company code** (from–to pick-list)
- **Profit Center** (from–to pick-list)
- **Item status**: Open items / Cleared items / All items, with **Open at key date** picker (default today)
- **Type** check boxes: Normal items (ticked by default), Special G/L, Noted, Parked, Customer items
- **Posting Date** single / From–To, plus Reset
Filters work on the saved data instantly; the SAP-only options (status, type, key date) are also stored in SAP API Settings for the sync.

## Tiles
Total Open Value (net), Debit (S), Credit (H), Overdue Value, Vendors, Line Items — all values in ₹ Cr.

## Cards
- **Overdue vs Not Due** donut (using SAP due flag / due date)
- **Arrears Buckets** donut: 0–30, 31–90, 91–180, 181–365, >1 yr (by days in arrears `verzn`)
- **Document Type split** (KZ payment, KR invoice, SA, ZA…)
- **Top 10 Vendors** by value
- **Top 10 Profit Centers**
- **Company Code wise** columns
- **Month wise Posting** trend (posting period)
- **Top 10 G/L Accounts**

## Detail table
Company Code, Vendor, Vendor Name, Doc No, Doc Type, Posting Date, Doc Date, Due Date, Days in Arrears, Amount (full ₹), Currency, Profit Center, G/L, Assignment, Text, Clearing Doc/Date. Search, pagination, Excel; PDF excludes filters and table. "Data available" and "Last Sync" next to Refresh/Sync/PDF.

## Launchpad card
Total Open Value, Overdue Value, Total Count, Last Sync.

## Speed (no latency)
- Store only the ~45 useful fields as typed columns (raw row kept compact) with indexes on posting date, company code, vendor, profit center.
- Tiles, cards and launchpad come from one server-side summary call (database function honouring each user's plant/profit-center access), not by downloading all 30,000+ lines.
- Table loads 50 rows per page from the server.

## Data load
- New table `zfbl1n_items`, keyed on company code + fiscal year + doc number + line item.
- Endpoint "ZFBL1N" in SAP API Settings with your payload; sync replaces the open-item snapshot only after a successful non-empty reply.
- Load your uploaded response. **Note:** the attached file is cut off — it says 30,724 items but only ~1,000 are complete. I'll load those; please re-send the full file (or run Sync) for all rows.

## Technical details
- Migration (mirrored in supabase/migrations + deploy/financial-accounting/zfbl1n.sql): table, RLS by `fi.zfbl1n` screen permission + profit-center/plant access, `zfbl1n_summary(filters)` and `zfbl1n_page(filters, cursor)` RPCs, sap_endpoints row.
- `src/lib/zfbl1n-map.ts` (payload mapping, date `0000-00-00` → null, sign from SHKZG/DMSHB), `src/lib/zfbl1n-data.ts`, `src/components/zfbl1n-dashboard.tsx`, replace placeholder route `reports/fi/zfbl1n.tsx`, launchpad tile in tile-card.
- Sync routing in sap-pull.server.ts, scheduler.mjs, rebuilt sync-core.mjs; payload builder sets OPEN_AT_KEY_DATE to today for scheduled runs.
- Vitest for summary helpers (debit/credit totals, arrears buckets).
