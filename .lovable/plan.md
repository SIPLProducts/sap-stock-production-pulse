# Vendor Ageing: stop sending S_KDATE and R1/R2/R3

At the moment every Vendor Ageing sync automatically adds **S_KDATE** (today's date) and forces one of **R1/R2/R3** to "X". After this change, none of those four fields is sent to SAP.

## Changes
- The payload sent to SAP drops S_KDATE, R1, R2 and R3, even if they're still in the saved payload in SAP API Settings.
- All other fields (VENDOR_FROM/TO, BUKRS, BLART, PRCTR, HKONT, MSME, D1–D9) are sent exactly as saved.
- This applies to both the Sync button and scheduled syncs, in the portal and in the middleware server.
- The Vendor Ageing screen is unchanged. Its Age basis filter (All/Due/Posting/GRN) still works on the stored data.

## Technical
- `src/lib/vendor-ageing-map.ts`: change `withVendorAgeingPayload` to delete `S_KDATE`, `R1`, `R2` and `R3` from the parsed object instead of setting them.
- Mirror the change in the same function in `middleware/sync-core.mjs`.
- Update `src/lib/vendor-ageing.test.ts` to check that those four keys are absent and other keys are kept.
- Update the Vendor Ageing rule in `AGENTS.md`. For Quality and Production, copy `middleware/sync-core.mjs` and restart.
