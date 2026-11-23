# Remove 13 tables and their screens

## What goes away
These screens disappear from the launchpad, menus, permissions and links:
- **Sales & Distribution:** Net Sales / Sales Analytics (incl. KPI, Drilldown, Dispatches, Finance-GST), Sales Register, Open Sales Orders, Order Book, Sales In Transit, Sales Revenue Targets
- **Purchase:** Purchase Register, Open Purchase Orders, Purchase Orders List
- **Financial Accounting:** Cash Flow, TBN (ZTBN)
- **Inventory:** Month Wise Stock
- **Production Planning:** Daily Production Report
- **Tables Master:** Month Wise Upload
- **Management Dashboard** widgets that read these tables

Their SAP API Settings endpoints and sync handling are removed too.

## What stays
Current Stock, Inventory Aging, Vendor Ageing, ZFBL1N, SAP MASTER, ZKEYRM, ZPC GROUP, Valuation Class Wise Subgroup, User Management, Roles, Permissions, SAP API Settings.
Modules left with no screens (Sales & Distribution, Production Planning) are hidden.

## Data
All rows in these tables are permanently deleted and the tables are dropped: daily_production, month_wise_upload, open_purchase_order, open_sales_orders, order_book, purchase_orders, purchase_register, sales_in_transit, sales_register, sales_revenue_targets, zcash_flow, zfisales_detail, ztbn. This cannot be undone.

The database will ask your permission for this step ("Execute backward incompatible database migrations" in Settings → Agent permissions must be "Ask each time" or "Always allow").

## Technical details
1. Code first: delete the route files, dashboards, `*-map.ts`/`*-data.ts`/functions modules and tests for these screens; remove their entries from screens.ts, nav.ts, sap-modules.ts, launchpad tiles, tile-card icons, sap-api.tsx branches, sap-pull.server.ts / sap-pull-shared.ts routing, `/api/public/sap/{sync,pull}/zfisales` routes, management-live.ts, ZKEYRM comparison inputs from purchase screens; strip them from middleware scheduler.mjs + sync-core entry and rebuild sync-core.mjs.
2. Migration: drop dependent RPCs (net_sales_summary, purchase_register_*, month_wise_*, mws_*, mwu_*, delete_month_wise_upload, activate_zfisales_snapshot, activate_open_sales_orders_snapshot), drop the 13 tables, delete their sap_endpoints rows, role_screens and tiles, unschedule their cron jobs.
3. Remove AGENTS.md rules and project-knowledge-style rules that describe deleted screens; add a deploy SQL file for Quality/Production.
4. Verify build and that the launchpad loads with the remaining screens.
