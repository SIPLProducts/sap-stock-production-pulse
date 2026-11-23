# Vendor Ageing: new tiles and cards from screenshots

## Why tile and card figures differ today
Checked the saved data (52,373 lines):
- SAP sends bills owed to vendors as minus amounts (payable, ₹4,810 Cr) and vendor advances/debits as plus amounts (₹3,624 Cr).
- The current "Total Outstanding" tile adds both together, so advances cancel out payables and it shows the net, ₹1,186 Cr.
- Cards like Top 10 Vendors and MSME are also net per group, so a vendor with a large advance looks small, and totals don't line up with what users expect.
- Only about 3,400 lines carry an MSME type; 37,000 lines have no MSME value from SAP, so they count as Non-MSME.

Fix: keep three separate figures everywhere — Net Outstanding, Net Payable (minus lines only) and Vendor Advances (plus lines only) — so tiles and cards add up consistently.

## Tiles (as in screenshot 2)
1. **Total Outstanding** — net value, sub-line "Across N Vendors"
2. **Net Payable** — sum of payable lines, "Credit Balance"
3. **Vendor Advances** — sum of advance lines, "Debit / Unadjusted"
4. **MSME Overdue (>45 Days)** — MSME payable lines older than 45 days, "Critical Compliance Alert"

## Cards
- **MSME vs Non-MSME Exposure** (screenshot 1): donut split into Micro, Small, Medium, Non-MSME (payable value), with legend.
- **Top 10 Vendors by Payable** (screenshot 3): bar list with a toggle: Top Payables / Top Advances / Top Profit Centers. Replaces the separate Top 10 Vendors and Top 10 Profit Centers cards.
- **GL Account & Document Type Split** (screenshot 3): stacked bar per G/L account, segments by document type.
- Ageing Buckets donut, Company Code and Segment cards stay; buckets use payable lines.

PDF gets the same tiles and cards; filters, table and Excel unchanged.

## Technical
- `vendor-ageing-data.ts`: `vaTotals` returns `net, payable, advances, msmeOverdue45`; add `vaMsmeClass` (Micro/Small/Medium/Non-MSME from mindk_desc) and `vaGroupSplit(payable|advance)`, stacked GL×docType helper.
- `vendor-ageing-dashboard.tsx`: new tiles, toggle card, stacked bar card; launchpad card total stays net.
- Unit tests for the payable/advance split and >45 day MSME rule.
