import { createFileRoute } from "@tanstack/react-router";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/fi/zfbl1n")({
  head: () => ({ meta: [
    { title: "ZFBL1N — RESL MIS Portal" },
    { name: "description", content: "Financial Accounting: Vendor line items (ZFBL1N)." },
    { property: "og:title", content: "ZFBL1N — RESL MIS Portal" },
    { property: "og:description", content: "Financial Accounting: Vendor line items (ZFBL1N)." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "fi.zfbl1n");
  return <ReportShell title="ZFBL1N" description="Financial Accounting">
    {!isLoading && !allowed ? <AccessDenied area="ZFBL1N" /> : <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">ZFBL1N — coming soon. Data will appear here once the SAP API is connected.</div>}
  </ReportShell>;
}
