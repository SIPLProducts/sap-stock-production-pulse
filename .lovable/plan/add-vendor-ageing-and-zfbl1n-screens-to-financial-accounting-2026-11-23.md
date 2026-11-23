# Add Vendor Ageing and ZFBL1N screens to Financial Accounting

## What you will see
- Two new cards in the Financial Accounting module on the launchpad and in the menu: **Vendor Ageing** and **ZFBL1N**, after TBN and Cash Flow, in the module's amber radiant colour.
- Each opens its own page with the RESL header and a "Coming soon" message until the SAP API and response are shared.
- Both appear in User Management so admins can give roles access (Sharvi Admin/Admin see them by default).

## Next step
Once you share the API document, payload and sample response for each (like Daily Production), I will build the dashboards, table and SAP sync.

## Technical details
- screens.ts: add `fi.vendor-ageing` (tile `fi_vendor_ageing`) and `fi.zfbl1n` (tile `fi_zfbl1n`) to the financial-accounting group.
- Routes: `src/routes/_authenticated/reports/fi/vendor-ageing.tsx` and `zfbl1n.tsx` using the shared coming-soon placeholder, each with its own head().
- Migration (mirrored in supabase/migrations) inserting the two permission keys into the screens/role_screens tables for admin roles.
