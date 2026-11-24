import { vendorAgeingQuery, vaTotals, vaLastSync, filterVendorAgeingBasis } from "@/lib/vendor-ageing-data";
import { zfSummaryQuery } from "@/lib/zfbl1n-data";
import { lastSyncedLabel, lastSyncShortLabel } from "@/lib/report-sync-time";
import type * as React from "react";
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Boxes, CircleDollarSign, Factory, Radio, ShoppingCart } from "lucide-react";
import { ShellBar } from "@/components/shell-bar";
import { useSidebar } from "@/components/ui/sidebar";
import { TableStatusTile, TileCard } from "@/components/tile-card";
import { GlassLoadingPage } from "@/components/glass-loading-page";
import { ROLE_HEADLINE, orderGroupsForRoles, primaryRole } from "@/lib/nav";
import { useLaunchpad } from "@/lib/use-launchpad";
import { useQuery } from "@tanstack/react-query";

const MODULE_ACCENT: Record<string, number> = { "sales-distribution": 1, purchase: 2, "financial-accounting": 3, inventory: 5, "production-planning": 4, "tables-master": 6 };

export const Route = createFileRoute("/_authenticated/launchpad")({
  head: () => ({ meta: [
    { title: "RESL MIS Portal — Analytics Launchpad" },
    { name: "description", content: "Role-based SAP enterprise analytics, operational KPIs, and reports." },
    { property: "og:title", content: "RESL MIS Portal — Analytics Launchpad" },
    { property: "og:description", content: "Enterprise SAP analytics and reporting launchpad." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: Launchpad,
});

const SECTION_META: Record<string, { subtitle: string; icon: typeof Factory }> = {
  "sales-distribution": { subtitle: "Quarterly Realtime Tracking", icon: Boxes },
  purchase: { subtitle: "MM Purchasing & Procurement", icon: ShoppingCart },
  "financial-accounting": { subtitle: "FI General Ledger & Cash Analysis", icon: CircleDollarSign },
  "production-planning": { subtitle: "PP Operations & Work Centre Status", icon: Factory },
  inventory: { subtitle: "Stock Levels, Monthly Trend & Aging", icon: Boxes },
  "tables-master": { subtitle: "SAP Schema & Dictionary Tables", icon: Boxes },
};

const SECTION_TITLES: Record<string, string> = {
  "sales-distribution": "Sales & Distribution",
  purchase: "Purchase",
  "financial-accounting": "Financial Accounting",
  "production-planning": "Production Planning",
  inventory: "Inventory",
  "tables-master": "Tables Master",
};

function SectionHeading({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: typeof Factory }) {
  return <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
    <div className="flex min-w-0 items-center gap-2"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span><h2 className="truncate text-[11px] font-bold tracking-wide text-foreground uppercase">{title}</h2></div>
    <p className="hidden text-[10px] text-muted-foreground sm:block">{subtitle}</p>
  </div>;
}

function Launchpad() {
  const { data, isLoading, error, refetch } = useLaunchpad();
  const [activeGroup, setActiveGroup] = useState("all");
  const { open: menuOpen, isMobile } = useSidebar();
  const showTabs = isMobile || !menuOpen;
  const groups = useMemo(() => data ? orderGroupsForRoles(data.groups.filter((group) => !["inventory", "tables-master"].includes(group.key) && data.tiles.some((tile) => tile.group_key === group.key)), data.roles) : [], [data]);
  const role = primaryRole(data?.roles);
  const visibleGroups = activeGroup === "all" ? groups : groups.filter((group) => group.key === activeGroup);

  return <div className="min-h-screen bg-background">
    <ShellBar launchpad title="Home" displayName={data?.profile?.display_name} screens={data?.screens} />
    {showTabs ? <div className="border-b border-border bg-card shadow-sm">
      <div className="flex gap-1 overflow-x-auto px-3 py-1.5 sm:px-5" role="tablist" aria-label="Launchpad modules">
        {[{ key: "all", title: "All Modules" }, ...groups].map((group) => <button key={group.key} type="button" role="tab" aria-selected={activeGroup === group.key} onClick={() => setActiveGroup(group.key)} className={`min-h-7 shrink-0 border-b-2 px-4 text-[10px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${activeGroup === group.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}>{group.title}</button>)}
      </div>
    </div> : null}

    <main className="px-3 py-4 sm:px-5">
      {error ? <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-card p-4 text-sm text-destructive"><span>Could not load modules. Please try again.</span><button type="button" onClick={() => void refetch()} className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted">Retry</button></div> : null}
      {role ? <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 shadow-launchpad-tile">
        <div className="flex min-w-0 items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><BadgeCheck className="size-[18px]" /></span><div className="min-w-0"><span className="text-[10px] font-bold tracking-wide text-primary uppercase">{role}</span><p className="truncate text-[11px] text-muted-foreground">{ROLE_HEADLINE[role]}</p></div></div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-[10px] font-semibold text-success"><Radio className="size-3" />Live Session Active</span>
      </div> : null}

      {data && data.roles.length === 0 ? <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Your account has no role assigned yet. Ask an administrator to grant you access.</div> : null}
      {data && data.roles.length > 0 && !isLoading && data.tiles.length === 0 ? <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Your role has no screens assigned yet. Ask an administrator to grant screen access.</div> : null}

      {isLoading ? <GlassLoadingPage /> : visibleGroups.map((group) => {
        const groupTiles = data?.tiles.filter((tile) => tile.group_key === group.key) ?? [];
        if (!groupTiles.length) return null;
        const meta = SECTION_META[group.key] ?? { subtitle: "SAP Operational Analytics", icon: Boxes };
        return <section key={group.key} className="mb-7" data-module-accent style={{ "--module-accent": `var(--kpi-${MODULE_ACCENT[group.key] ?? 2})` } as React.CSSProperties}>
          <SectionHeading title={SECTION_TITLES[group.key] ?? group.title} subtitle={meta.subtitle} icon={meta.icon} />
          {group.key === "sales-distribution" || group.key === "purchase" || group.key === "production-planning" || group.key === "inventory" || group.key === "financial-accounting" ? <div className={group.key === "sales-distribution" || group.key === "purchase" || group.key === "production-planning" || group.key === "inventory" ? "sd-compact grid grid-cols-1 gap-2 md:grid-cols-5" : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"}>
            {groupTiles.map((tile) => tile.screen_key === "fi.vendor-ageing" ? <VendorAgeingTile key={tile.id} href={tile.target_path ?? "/reports/fi/vendor-ageing"} /> : tile.screen_key === "fi.zfbl1n" ? <Zfbl1nTile key={tile.id} href={tile.target_path ?? "/reports/fi/zfbl1n"} /> : <TileCard key={tile.id} tile={tile} {...(data?.kpis[tile.kpi_key ?? ""] ? { kpi: data.kpis[tile.kpi_key ?? ""] } : {})} />)}
          </div> : group.key === "tables-master" ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {groupTiles.filter((tile) => ["tables.sap-master", "tables.zrmmat", "tables.zpc-group", "tables.valuation-subgroup"].includes(tile.screen_key ?? "")).map((tile, index) => (
              <TableStatusTile
                key={tile.id}
                                title={tile.title}
                value="Open"
                note={tile.subtitle ?? "Table configuration"}
                {...(tile.target_path ? { href: tile.target_path } : {})}
              />
            ))}
          </div> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <TableStatusTile title="PP Overview" value="Live" note="Production overview" href="/reports/module/pp" action="Open overview" icon={Factory} accent={3} />
            {groupTiles.filter((tile) => tile.kind !== "launch").map((tile) => <TileCard key={tile.id} tile={tile} {...(data?.kpis[tile.kpi_key ?? ""] ? { kpi: data.kpis[tile.kpi_key ?? ""] } : {})} />)}
          </div>}
        </section>;
      })}
      {data ? <p className="mt-7 text-[10px] text-muted-foreground">Data source: {data.providerMode === "mock" ? "sample data (SAP not connected)" : "SAP OData"}</p> : null}
    </main>
  </div>;
}
function Zfbl1nTile({ href }: { href: string }) {
  const q = useQuery(zfSummaryQuery());
  const s = q.data;
  const cr = (v: number) => (v / 1e7).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <TableStatusTile title="ZFBL1N" value={q.isLoading ? "…" : q.isError ? "Couldn't load" : s && s.lines ? `₹ ${cr(Math.abs(s.net))} Cr` : "No data"} note={q.isError ? "Refresh the page to try again" : "Net Balance (₹ Cr)"} href={href} accent={3}>
    {s && s.lines ? <ul className="mt-2 space-y-0.5 text-[10px]">
      <li className="flex justify-between gap-1"><span className="text-muted-foreground">Overdue</span><span className="font-semibold tabular-nums text-foreground">₹ {cr(s.overdue)} Cr</span></li>
      <li className="flex justify-between gap-1"><span className="text-muted-foreground">Total Count</span><span className="font-semibold tabular-nums text-foreground">{s.lines.toLocaleString("en-IN")}</span></li>
      <li className="truncate text-muted-foreground" title={lastSyncedLabel(s.lastSync)}>{lastSyncShortLabel(s.lastSync)}</li>
    </ul> : null}
  </TableStatusTile>;
}
function VendorAgeingTile({ href }: { href: string }) {
  const q = useQuery(vendorAgeingQuery);
  const s = q.data ? vaTotals(filterVendorAgeingBasis(q.data, "due")) : null;
  const sync = q.data ? vaLastSync(q.data) : null;
  const cr = (v: number) => (v / 1e7).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <TableStatusTile title="Vendor Ageing" value={q.isLoading ? "…" : q.isError ? "Couldn't load" : s && s.lines ? `₹ ${cr(s.total)} Cr` : "No data"} note={q.isError ? "Refresh the page to try again" : "Total Outstanding (₹ Cr)"} href={href} accent={3}>
    {s && s.lines ? <ul className="mt-2 space-y-0.5 text-[10px]">
      <li className="flex justify-between gap-1"><span className="text-muted-foreground">Vendors</span><span className="font-semibold tabular-nums text-foreground">{s.vendors.toLocaleString("en-IN")}</span></li>
      <li className="flex justify-between gap-1"><span className="text-muted-foreground">Total Count</span><span className="font-semibold tabular-nums text-foreground">{s.lines.toLocaleString("en-IN")}</span></li>
      <li className="truncate text-muted-foreground" title={lastSyncedLabel(sync)}>{lastSyncShortLabel(sync)}</li>
    </ul> : null}
  </TableStatusTile>;
}
