# Vendor Ageing: brand loader + faster loading

## Why it is slow
When Vendor Ageing opens, the browser downloads every saved line (about 52,000 rows, 34 columns each) in 53 back-to-back requests of 1,000 rows, then calculates all tiles and charts on the device. That is several MB and dozens of round trips before anything shows, so the screen sits on "Loading vendor ageing…". ZFBL1N avoids this by letting the database do the totals.

## What will change
1. **Spinner after the screen opens**: replace the plain "Loading vendor ageing…" text with the RESL brand loader, shown inside the screen area (header, Refresh/Sync stay visible). Apply the same to other report screens that show a plain "Loading…" line.
2. **Faster first view**:
   - Fetch only the columns the dashboard uses (drop long text columns such as item text, sales/PO numbers, raw d10–d90 where not needed).
   - Load pages in parallel (several at once) instead of one after another, using id ranges.
   - Keep the result cached for the session so returning to the screen is instant; data still refreshes only on Refresh/Sync.
3. **Database-side totals (if still slow after step 2)**: add `vendor_ageing_summary(filters)` and `vendor_ageing_page(filters, search, offset, limit)` functions, same pattern as ZFBL1N, so tiles/charts arrive as one small response and the table loads 50 rows at a time. Plus indexes on budat, prctr, lifnr, bukrs.

## Technical details
- `src/lib/vendor-ageing-data.ts`: slimmer COLS, parallel keyset/id-range fetch (count first, then ~6 concurrent pages).
- `vendor-ageing.tsx`: render `<BrandLoader inline />` (new inline variant: no full-screen overlay, centered in content) while `!stock.data`.
- `brand-loader.tsx`: add `inline` prop.
- Step 3 migration mirrored in `supabase/migrations/` and `deploy/financial-accounting/` for Quality/Production.
- Verify with Playwright: time to first paint of tiles before/after.
