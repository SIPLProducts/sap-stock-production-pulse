<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Capture PDFs by visual rows with repeated headers/numbered footers; preserve screen colors and independent PDF geometry. Exclude sync metadata and unmount the Open Orders screen header during capture.
- Default Sales and Net Sales launchpad to the current April–March FY; explicit shared/URL dates override reports. Name every PDF/Excel/CSV/PNG download "<Screen name>_DD-MM-YYYY" (IST) via datedFileName.
- Store multiple sync times in backward-compatible IST:HH:mm,... expressions.
- Give coming-soon screens stable routes and permission keys through a shared placeholder.
- Derive Model Wise Type from filtered product_type; retain full ranking on screen and export Top 10.
- Align filters through desktop-only placement and equal label tracks. Bulk selection is opt-in; null means unrestricted and [] means none.
- Use pure source-backed filter/code-description helpers; keep customer identity by sold-to code. Map S_VTWEG before VTWEG; reuse stored channel/sales_type and industry_description for labels.
- Share pure detailed-table status/search/date-sort helpers with pagination and Excel; table-only controls must not affect dashboard totals.
- Keep readable responsive screen charts and side-by-side donut/table tracks with local overflow; preserve independent PDF sizing.
- Root ThemeProvider shares appearance with exports; use shared colors and gradients.
- Group plants by code; fit plant/zone categories in width-aware rows with explicit-unit scales and fixed PDF heights.
- Use pure helpers for launchpad/table totals and filtered exact-text LD status aggregates; capture LD chart separately in PDF to avoid crowding existing cards.
- Persist AH and monetary/status fields as typed columns alongside raw SAP rows; include them in report queries/search/exports. Use typed monetary source everywhere; open_value is a compatibility mirror.
- Mirror Cloud migrations in timestamped supabase/migrations for self-hosted deployment.
- Retire absent SAP business mappings additively with deprecation comments; preserve internal sync fields and harmless older key aliases.

- Keep chart-only group selection in a pure helper after full filtered aggregation; totals and PDF retain full groups to avoid truncating report data.

- Switch monetary-source versions in report query keys when the source changes so cached pre-change values cannot survive navigation.
- Backfill new typed SAP monetary columns from raw rows with the mapper's numeric normalization before switching reads; retain earlier columns independently to support additive deployment.
- Auth state changes invalidate queries only when the signed-in user id changes (sign-out clears cache), because Supabase re-emits SIGNED_IN on tab focus. The Cash Flow launchpad card shares the Cash Flow screen query so both change only on explicit Refresh/Sync.
- User Management dropdown masters (plants, profit centers) upsert into public.sap_user_dropdown_masters on category + code without snapshots, since SAP returns the full current master list.
- SAP API Settings builds generic request fields via payload-fields.ts; Vendor Ageing exposes only S_KDATE through vendor-ageing-request.ts while retaining the full template, so hidden constants and sequential basis flags remain intact.

- Import the shared logo CDN pointer in portal and PDF headers, preserving its original colors; one asset keeps branding consistent across screens.
- Vendor Ageing sync calls R1, R2, R3 sequentially, tagging pc_text with the SAP request basis and sharing synced_at; replace older rows only after all three non-empty valid replies are saved, rollback the new rows on failure, and default screen/launchpad totals to Due Date to avoid counting three response sets together.
- Unmapped SAP endpoints fail with "No storage is set up" instead of defaulting to a report table, because the retired sales/purchase/stock tables were removed.
- ZFBL1N (zfbl1n_items) screens and launchpad read aggregates through zfbl1n_summary/zfbl1n_page RPCs (invoker, RLS applies) instead of downloading line items, so 30k+ rows load instantly; sync replaces the snapshot like Vendor Ageing.
