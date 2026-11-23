# Vendor Ageing: three separate Top 10 cards

Replace the single card with the Top Payables / Top Advances / Top Profit Centers buttons by three separate cards, each always visible, on screen and in the PDF:

1. **Top 10 Vendors by Payable**: what you owe each vendor
2. **Top 10 Vendors by Advance**: advances paid to each vendor
3. **Top 10 Profit Centers**: what you owe, by profit center

## Layout
- Row 1: the three Top 10 cards side by side (stacked on small screens).
- Row 2: GL Account & Document Type Split at full width.
- All other cards and tiles stay as they are.

## Technical
- In `vendor-ageing-dashboard.tsx`, remove the `top` state and the toggle buttons. Render three `BarList` cards from `vaGroupSplit` (vendor/payable, vendor/advance, prctrText/payable).
