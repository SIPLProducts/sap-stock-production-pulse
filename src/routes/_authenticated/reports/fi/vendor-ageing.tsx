import { createFileRoute } from "@tanstack/react-router";
import { AccessDenied, ReportShell } from "@/components/report-shell";
import { hasScreen } from "@/lib/screens";
import { useLaunchpad } from "@/lib/use-launchpad";

export const Route = createFileRoute("/_authenticated/reports/fi/vendor-ageing")({
  head: () => ({ meta: [
    { title: "Vendor Ageing — RESL MIS Portal" },
    { name: "description", content: "Financial Accounting: Vendor outstanding by age bucket." },
    { property: "og:title", content: "Vendor Ageing — RESL MIS Portal" },
    { property: "og:description", content: "Financial Accounting: Vendor outstanding by age bucket." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useLaunchpad();
  const allowed = data?.isSuperAdmin || hasScreen(data?.screens, "fi.vendor-ageing");
  return <ReportShell title="Vendor Ageing" description="Financial Accounting">
    {!isLoading && !allowed ? <AccessDenied area="Vendor Ageing" /> : <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">Vendor Ageing — coming soon. Data will appear here once the SAP API is connected.</div>}
  </ReportShell>;
}
