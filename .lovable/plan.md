# Vendor Ageing: Ageing Buckets, MSME and GL Split in one row

## New layout
```text
Row 1: [ Ageing Buckets ] [ MSME vs Non-MSME Exposure ] [ GL Account & Document Type Split ]
Row 2: [ Top 10 Payable ] [ Top 10 Advance ] [ Top 10 Profit Centers ]
Row 3: [ Company Code ] [ Segment ]   (unchanged)
```
- The three cards share one row at equal width on large screens. On medium screens they show two per row, and on phones they stack.
- The PDF follows the same layout.

## Technical
- In `vendor-ageing-dashboard.tsx`, merge the Ageing Buckets wrapper and the MSME/GL row into one `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` row.
