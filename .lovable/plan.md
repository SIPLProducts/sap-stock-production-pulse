# Remove the Inventory and Tables Master modules, and Alerts

## What disappears
- **Inventory module:** the Current Stock and Inventory Aging screens, their launchpad cards and tab, their side menu entries, and their options in Screen Permissions.
- **Tables Master module:** the SAP MASTER, ZKEYRM, ZPC GROUP and Valuation Class Wise Subgroup screens, plus the Tables overview pages. Their launchpad cards and tab, side menu entries and permission options go too.
- **Alerts:** the Alerts button is removed from the top bar.

## What stays
- Financial Accounting (Vendor Ageing, ZFBL1N), Administration, and everything else.
- Saved data in the database is **not deleted**. Only the screens are removed, so they can be brought back later. Deleting the stored tables is permanent, so I'll only do that if you ask.
- Old links to the removed screens go to the launchpad.

## Technical
- Delete the routes `reports/inv/*`, `reports/tables/*` and `tables/index.tsx` / `tables/$tableKey.tsx`. Also delete any component used only by them, such as `current-stock-dashboard`, `inventory-master-filters` and `master-table-screen`, after checking it has no other imports.
- Remove the `module.inv` and Tables Master entries from `PERMISSION_MODULES` in `screens.ts`. Remove the matching groups and tiles from `launchpad.tsx`, `tile-card.tsx`, `nav.ts`, `__root.tsx` and `SCREEN_PATHS` in `app-sidebar.tsx`.
- Remove the Inventory and Tables Master SAP sync and endpoint wiring if it's only used by these screens. Shared SAP master tables stay in the database.
- Remove the Alerts button in `shell-bar.tsx`.
- Run the existing tests, and delete tests that only covered removed code.
