# Use the full screen width on report screens

## Why there is empty space
Every report screen (Vendor Ageing, Current Stock, Inventory Aging, and the others) is capped at a fixed width of 1400px and centred. On wider monitors, such as your 1920px screen, this leaves empty bands on the left and right.

## Change
- Remove the fixed cap so the header (title, Data available, Refresh/Sync/PDF), the filters, tiles and cards stretch to the screen width, with a small side margin.
- Cards keep adjusting to the screen size:
  - Phone: 1 card per row
  - Tablet: 2 cards per row
  - Laptop and wider: 3 per row (Vendor Ageing rows), with tiles 4 across
- The note text under the page also uses the full width.
- PDF layout is unchanged.

## Technical
- `src/components/report-shell.tsx`: replace `mx-auto max-w-[1400px] px-4` with `w-full px-3 sm:px-4 xl:px-6` in the header, main and footer note. This applies to every screen that uses ReportShell, so all of them line up the same way.
