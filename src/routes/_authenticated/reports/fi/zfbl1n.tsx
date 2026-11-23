import { Zfbl1nDashboard } from "@/components/zfbl1n-dashboard";
import { zfSummaryQuery } from "@/lib/zfbl1n-data";
import { lastSyncedLabel } from "@/lib/report-sync-time";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import reslLogo from "@/assets/resl-logo.png.asset.json";
import { useRef, useState } from "react";
import { FileDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { SyncNowButton } from "@/components/sync-now-button";
import { exportDashboardPdf } from "@/lib/chart-export";
import { datedFileName } from "@/lib/format";
import { createFileRoute } from "@tanstack/react-router";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/fi/zfbl1n")({
  head: () => ({ meta: [
    { title: "ZFBL1N Vendor Line Items — RESL MIS Portal" },
    { name: "description", content: "Financial Accounting: vendor line items by vendor, company code, profit center, G/L and days in arrears." },
    { property: "og:title", content: "ZFBL1N Vendor Line Items — RESL MIS Portal" },
    { property: "og:description", content: "Financial Accounting: vendor line items by vendor, company code, profit center, G/L and days in arrears." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "fi.zfbl1n");
  const qc = useQueryClient();
  const base = useQuery({ ...zfSummaryQuery(), enabled: !!allowed });
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const pdf = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 300));
    try { await exportDashboardPdf(ref.current, datedFileName("ZFBL1N", "pdf"), "[data-pdf-exclude]", { headerSelector: "[data-pdf-header]", footerText: "RESL Confidential — Internal Use Only", preserveComputedChartColors: true }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "PDF failed"); }
    finally { setBusy(false); }
  };
  const s = base.data;
  const dm = (d: string) => d.slice(0, 10).split("-").reverse().join("-");
  const actions = <>
    {s?.minDate && s.maxDate ? <span data-pdf-exclude className="hidden h-7 items-center rounded-md border border-primary/30 bg-primary/10 px-2 text-[11px] text-primary sm:inline-flex"><span className="font-medium">Data available:</span>&nbsp;{dm(s.minDate)} – {dm(s.maxDate)}</span> : null}
    {s ? <span data-pdf-exclude className="hidden text-[11px] text-muted-foreground md:inline">{lastSyncedLabel(s.lastSync)}</span> : null}
    <Button type="button" variant="action" size="sm" className="h-7 text-xs" disabled={base.isFetching} onClick={() => qc.invalidateQueries({ queryKey: ["zfbl1n"] })}><RefreshCw className={`size-3.5 ${base.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
    <SyncNowButton endpointName="ZFBL1N" label="ZFBL1N" />
    <Button type="button" variant="export" size="sm" className="h-7 text-xs" onClick={pdf} disabled={busy || !s}><FileDown className="size-3.5" />PDF</Button>
  </>;
  return <ReportShell title="ZFBL1N – Vendor Line Items" unitLabel="Val in Cr" compact actions={allowed ? actions : undefined}>
    {!isLoading && !allowed ? <AccessDenied area="ZFBL1N" /> : <div ref={ref}>
      {busy ? <div data-pdf-header className="flex items-center justify-between gap-6 border-b border-border bg-card px-4 py-3"><div className="min-w-0"><img src={reslLogo.url} alt="RESL" className="h-12 w-auto object-contain" /><p className="mt-1 text-xs font-semibold text-card-foreground">RESL</p></div><div className="text-right"><h1 className="text-lg font-bold text-card-foreground">ZFBL1N – Vendor Line Items</h1><p className="text-[11px] font-medium text-muted-foreground">Val in Cr</p></div></div> : null}
      <Zfbl1nDashboard /></div>}
  </ReportShell>;
}
