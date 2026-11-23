# Loader "r", ZFBL1N rows per page, clearer Month Wise Posting

## 1. Loader: make the "r" clear
In the loader, the logo picture is split down the middle to show the "r" and the "e" one after the other. The split cuts into the "r", and the red circle drawn on top hides part of it.
- Split the picture where the "r" and "e" really meet, not at the exact middle.
- When the "r" and "e" have appeared, the drawn circles fade out so the real logo shows sharp and in its original colors.
- Slightly bigger logo (about 200px wide).

## 2. ZFBL1N table: rows per page
- Add a "Rows per page" dropdown with 50 / 100 / 250 / 500, next to Prev/Next at the bottom left. The default stays 50.
- Changing it goes back to page 1. The line count, "Page X / Y" and the total row follow the chosen size. Excel export is unchanged and still exports all filtered lines.

## 3. Month Wise Posting: why it's unclear and the fix
How it's shown now: one bar per month for the last 24 months that have data, using the net amount (debits minus credits) in Cr. Labels look like "06-18" (month-year), which reads like a date. One very large month (Feb-2019, about ₹46.6 Cr) makes every other bar look flat.
Fix:
- Labels as "Jun-18", "Jul-18"… (month name and year), tilted so all fit.
- Show the value above each bar (2 decimals, Cr). The tooltip gives month, value and line count.
- Bars: radiant fill in the card's color. Negative (credit) months show in red, below zero.
- Card subtitle: "Net posting per month · Val in Cr".

## Technical details
- `src/styles.css`: change the `--r`/`--e` clip-path split to about 47%/53%. In `bl-draw`/`bl-draw-2`, fade the ring opacity to 0 between 45% and 55%. Set `__mark` width to 200px.
- `src/components/zfbl1n-dashboard.tsx`: add `pageSize` state, pass it to `zfbl1n_page` `_limit`/offset, and include it in the query key. Add a shadcn Select. Replace `PlantColumns` for months with a Recharts BarChart: angled ticks, LabelList, Cell colours by sign.
- The month helper becomes a pure helper `zfMonthLabel("2019-02") → "Feb-19"` with a small test.
- Check on screen with an admin session if one is available. The Sunil account lacks ZFBL1N access.
