# Vendor Ageing: move GL Account & Document Type Split beside MSME

## New layout
```text
Row 1: [ Ageing Buckets            ] (full width)
Row 2: [ MSME vs Non-MSME Exposure ] [ GL Account & Document Type Split ]
Row 3: [ Top 10 Payable ] [ Top 10 Advance ] [ Top 10 Profit Centers ]
Row 4: [ Company Code ] [ Segment ]   (unchanged)
```
- Ageing Buckets moves to its own row so the MSME card and the GL card can sit side by side at equal width. On small screens they stack.
- The separate full-width row for the GL card is removed. The PDF follows the same layout.

## Technical
- In `vendor-ageing-dashboard.tsx`: render Ageing Buckets alone, then a `lg:grid-cols-2` row with the MSME and GL Split cards, and delete the old GL wrapper row.
