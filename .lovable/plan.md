# Vendor Ageing: remove day-range tiles

Remove these tiles from the Vendor Ageing screen (and its PDF):
- 0-30 Days
- 31-180 Days
- 181-365 Days
- > 1 Year

Keep: Total Outstanding, MSME Outstanding, Vendors. The tile row adjusts to 3 tiles so they fill the width.

The Ageing Buckets donut, charts, table and Excel stay unchanged.

## Technical details
- `src/components/vendor-ageing-dashboard.tsx`: drop the four day entries from `tiles`; grid becomes `grid-cols-1 sm:grid-cols-3`.
