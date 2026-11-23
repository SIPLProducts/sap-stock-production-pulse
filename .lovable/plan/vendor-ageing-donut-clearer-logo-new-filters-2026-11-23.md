# Vendor Ageing: donut, clearer logo, new filters

## 1. Ageing Buckets as a donut
- Replace the column chart in the "Ageing Buckets" card with a donut (same style as "MSME vs Non-MSME"), with a side table showing Bucket, Val (Cr) and %.
- Empty buckets are left out. PDF keeps its own sizing.

## 2. Logo easier to see
- The red logo is very small (h-4/h-5) on the dark top bar. Make it larger and put it on a small white rounded badge so the red stands out in Light, Dark and Glassy themes.
- PDF header logo made slightly larger too.

## 3. Filter changes (filter card, in this order)
1. **Posting Date** date picker first (From – To). Filters lines by posting date; empty means all dates.
2. Vendor, Company Code, Document Type, Profit Center, G/L Account, MSME (as now).
3. **Profit Center Text** multi-select (from the saved PC text, e.g. names), beside Profit Center.
4. **Age basis** radio buttons: All, Due Date, Posting Date, GRN Date.
   - All = no change (figures as stored).
   - Due Date / Posting Date / GRN Date = keep lines that have that date, and age them from that date to the key date into the same buckets (0–30, 31–90, ...). GRN Date is used only if SAP sends it; if not present, that option shows a "No GRN date in data" note.
5. Reset clears all of the above back to defaults (All, empty dates).

Tiles, charts, table and Excel all follow these filters.

## Technical details
- `src/components/vendor-ageing-dashboard.tsx`: add `Donut` for buckets; add posting date range state (shadcn Popover + Calendar, `pointer-events-auto`); add `pcText` key to filter options; add RadioGroup `basis`; re-bucket in a pure helper (`rebucketByBasis(rows, basis, keyDate, D-limits)`) with a small vitest.
- `src/components/shell-bar.tsx`: logo `h-7` inside `bg-white rounded px-1.5 py-0.5`.
- No database or sync changes.
