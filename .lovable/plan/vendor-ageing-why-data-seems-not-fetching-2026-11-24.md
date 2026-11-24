# Vendor Ageing: why data seems "not fetching"

## What the records show (checked just now, 11:28 UTC / 4:58 PM IST)

The SAP call **is working**. The latest sync is still going through its three steps:

| Step | SAP reply | Rows saved | Finished (IST) |
|---|---|---|---|
| Due Date (R1) | OK | 52,373 | 4:45 PM |
| Posting Date (R2) | OK | 52,373 | 4:56 PM |
| GRN Date (R3) | in progress | — | expected about 5:05–5:10 PM |

- The failed attempts at 4:25, 4:26 and 4:34 PM IST came from the tunnel (502). At those times the computer running the middleware could not reach SAP (10.150.150.154:8103). After that, it connected.
- Until the GRN step finishes, the old 23-11 data stays in place. New data replaces old data only after all three steps succeed.
- The screen changes only when you click Refresh. If it was open before the sync finished, it still shows the old figures.

## Why it is slow (about 11 minutes per step)

- SAP itself takes about 3 minutes per reply (44 MB).
- Saving takes another 7–8 minutes. That matches the **old** slow saving method. There is also no "Syncing: Due Date (1/3)" step badge. So the sync was started from a version without the latest speed-up, most likely the published site, which has not been republished since that change.

## Plan

1. **No code change needed for fetching.** Let the GRN step finish. Then click Refresh on the Vendor Ageing screen. Due Date, Posting Date and GRN Date should each show 52,373 lines dated 24-11-2026.
2. **Republish the app** so the faster saving (2,000-row batches, 4 at a time) and the step badge go live. Expected total sync time: about 10–12 minutes instead of about 33.
3. If you sync from your own server copy (Quality/Production), copy the updated `src/` build and `middleware/scheduler.mjs` there too.
4. After the next sync, check the database again to confirm each step saves in under 1 minute and the step badge shows.

## Technical notes
- Evidence: `sap_sync_runs` rows for `Vendor_Ageing`. R1 finished 11:15:07Z and R2 finished 11:26:45Z, each 52,373 stored. There were no `running` step rows, so the deployed code predates the step-progress change. `vendor_ageing` currently holds R1 + R2 rows at synced_at 11:04:20Z plus 52,373 legacy untagged rows from 23-11.
- Keep `SAP_TIMEOUT_MS=600000` in `middleware/.env`.
