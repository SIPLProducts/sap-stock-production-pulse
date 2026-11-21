import { DailyProductionDashboard } from "@/components/daily-production-dashboard";
import { dailyProductionQuery, dprLastSync } from "@/lib/daily-production-data";
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

export const Route = createFileRoute("/_authenticated/reports/pp/daily-production-report")({
  head: () => ({ meta: [
    { title: "Daily Production Report — RESL MIS Portal" },
    { name: "description", content: "Production Planning: daily production quantity, value and scrap by plant, work center and material." },
    { property: "og:title", content: "Daily Production Report — RESL MIS Portal" },
    { property: "og:description", content: "Production Planning: daily production quantity, value and scrap by plant, work center and material." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "pp.daily-production-report");
  const qc = useQueryClient();
  const stock = useQuery({ ...dailyProductionQuery, enabled: !!allowed });
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const pdf = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 300));
    try { await exportDashboardPdf(ref.current, datedFileName("Daily Production Report", "pdf"), "[data-pdf-exclude]", { headerSelector: "[data-pdf-header]", footerText: "RESL Confidential — Internal Use Only", preserveComputedChartColors: true }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "PDF failed"); }
    finally { setBusy(false); }
  };
  const dates = (stock.data ?? []).map((r) => r.date).filter(Boolean).sort();
  const dm = (d: string) => d.split("-").reverse().join("-");
  const actions = <>
    {dates.length ? <span data-pdf-exclude className="hidden h-7 items-center rounded-md border border-primary/30 bg-primary/10 px-2 text-[11px] text-primary sm:inline-flex"><span className="font-medium">Data available:</span>&nbsp;{dm(dates[0]!)} – {dm(dates[dates.length - 1]!)}</span> : null}
    {stock.data ? <span data-pdf-exclude className="hidden text-[11px] text-muted-foreground md:inline">{lastSyncedLabel(dprLastSync(stock.data))}</span> : null}
    <Button type="button" variant="action" size="sm" className="h-7 text-xs" disabled={stock.isFetching} onClick={() => qc.invalidateQueries({ queryKey: dailyProductionQuery.queryKey })}><RefreshCw className={`size-3.5 ${stock.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
    <SyncNowButton endpointName="Daily_Production_Report" label="Daily Production Report" />
    <Button type="button" variant="export" size="sm" className="h-7 text-xs" onClick={pdf} disabled={busy || !stock.data}><FileDown className="size-3.5" />PDF</Button>
  </>;
  return <ReportShell title="Daily Production Report" unitLabel="Val in Cr" compact actions={allowed ? actions : undefined}>
    {!isLoading && !allowed ? <AccessDenied area="Daily Production Report" /> : stock.error ? <p className="text-sm text-destructive">{(stock.error as Error).message}</p> : !stock.data ? <p className="text-sm text-muted-foreground">Loading production…</p> : <div ref={ref}>
      {busy ? <div data-pdf-header className="flex items-center justify-between gap-6 border-b border-border bg-card px-4 py-3"><div className="min-w-0"><img src={reslLogo.url} alt="RESL" className="h-10 w-auto object-contain" /><p className="mt-1 text-xs font-semibold text-card-foreground">RESL</p></div><div className="text-right"><h1 className="text-lg font-bold text-card-foreground">Daily Production Report</h1><p className="text-[11px] font-medium text-muted-foreground">Val in Cr</p></div></div> : null}
      <DailyProductionDashboard rows={stock.data} /></div>}
  </ReportShell>;
}
