# Vendor Ageing sync: what happened and how to make it faster

## What the database shows right now
- **Due Date (R1) is saved:** 52,373 rows came back from SAP and were all stored (sync started 11:04, SAP answered in about 3 minutes, saving took about 7.5 minutes, finished at 11:15).
- **Posting Date (R2) is being saved now:** SAP already answered and rows are going in (2,500 saved so far at 11:19).
- **GRN Date (R3)** runs after R2.
- The previous data (from 23-11, 52,373 rows) stays until all three calls finish. Only then is it removed. This is on purpose, so the screen never goes empty if a call fails.

So the data is not lost. The sync is just slow: about **10 minutes for each basis, so about 30 minutes in total**. Until it finishes, the screen still shows the data loaded before you clicked Refresh.

The middleware line `rows parsed: n/a (not an array payload)` only affects what the log shows. The middleware log counts only lowercase `data`, but SAP sends `DATA`. Saving reads `DATA` correctly.

## Planned fixes

1. **Faster saving (biggest gain)**
   - Save in batches of 2,000 rows, with 4 batches running at once, instead of one batch of 500 rows at a time.
   - Expected: saving 52k rows takes under 1 minute instead of about 7.5 minutes, so a full three-call sync takes about 10–12 minutes instead of 30.
   - Apply the same change in the self-hosted scheduler (`middleware/scheduler.mjs`), so Quality and Production get the same speed.

2. **Visible progress during sync**
   - Log a "running" entry when each call starts: "Due Date 1/3", "Posting Date 2/3", "GRN Date 3/3". The sync status then shows which step is running, not just a long silence.
   - Show this step on the Vendor Ageing screen beside Last sync while a sync is running. Nothing refreshes by itself: the screen still updates only when you click Refresh.

3. **No double counting while a sync is running**
   - With "All" selected, the screen currently adds the old untagged rows to the new tagged rows. Change it to show only the newest complete set of data. Old untagged rows are used only when no tagged data exists yet.

4. **Middleware log count**
   - In `middleware/server.mjs`, also count `parsed.DATA`, so the log shows `rows parsed: 52373`.

## Technical details
- `src/lib/sap-pull.server.ts` `storeVendorAgeingPayload`: chunk 2000, concurrency 4. Insert a `sap_sync_runs` row with status `running` and the basis label before the middleware call, then update that same row. Rollback and "delete old rows only after R3" stay the same.
- `middleware/scheduler.mjs`: same batching and progress row; `middleware/vendor-ageing-sync.test.mjs` updated.
- `src/lib/vendor-ageing-data.ts` `filterVendorAgeingBasis("all")`: use the latest synced_at that has tagged rows, otherwise legacy rows; add a test.
- `middleware/server.mjs`: add `parsed?.DATA` to the row-count expression.
- Middleware changes need copying to the Windows machine and restarting `node server.mjs`.
