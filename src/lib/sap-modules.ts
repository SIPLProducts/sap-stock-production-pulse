/**
 * SAP application modules beyond MM procurement.
 * Client-safe metadata: shared by the launchpad tiles, the module report
 * route and the mock/OData provider so all three stay in sync.
 */

export type ModuleRole = "admin" | "buyer" | "approver" | "viewer";

export type ModuleKey = "sd" | "fi" | "pp";

export type ModuleKpiDef = {
  key: string;
  label: string;
  subtitle: string;
  unit?: string;
  base: number;
  decimals?: number;
  kind: "kpi" | "chart";
  icon: string;
};

export type ModuleDef = {
  key: ModuleKey;
  code: string;
  title: string;
  groupKey: string;
  groupTitle: string;
  description: string;
  seed: number;
  trendLabel: string;
  trendUnit: string;
  secondaryLabel: string;
  breakdownLabel: string;
  dimensions: string[];
  columns: { key: string; label: string; numeric?: boolean }[];
  documentPrefix: string;
  statuses: string[];
  kpis: ModuleKpiDef[];
};

/** Screen permission key for a module report. */
export function moduleScreenKey(moduleKey: string): string {
  return `module.${moduleKey}`;
}

/** Module access is granted through screen permissions on the role. */
export function canAccessModule(moduleKey: string, screens: readonly string[] | undefined): boolean {
  if (!MODULES.some((mod) => mod.key === moduleKey)) return false;
  const prefixes: Record<string, string> = { sd: "sd.", fi: "fi.", pp: "pp." };
  const prefix = prefixes[moduleKey];
  return Boolean(prefix && (screens ?? []).some((screen) => screen.startsWith(prefix)));
}

export function modulesForScreens(screens: readonly string[] | undefined): ModuleDef[] {
  return MODULES.filter((mod) => canAccessModule(mod.key, screens));
}


export const MODULES: ModuleDef[] = [

  {
    key: "fi",
    code: "FI",
    title: "Financial Accounting",
    groupKey: "financial-accounting",
    groupTitle: "Financial Accounting",
    description: "Receivables, payables, cash position and closing status.",
    seed: 3307,
    trendLabel: "Cash inflow",
    trendUnit: "EUR",
    secondaryLabel: "Outflow",
    breakdownLabel: "Open receivables by ageing bucket",
    dimensions: ["Not due", "1-30 days", "31-60 days", "61-90 days", "91-180 days", "> 180 days"],
    columns: [
      { key: "document", label: "Document" },
      { key: "partner", label: "Business partner" },
      { key: "dimension", label: "Ageing" },
      { key: "site", label: "Company code" },
      { key: "quantity", label: "Days open", numeric: true },
      { key: "value", label: "Amount", numeric: true },
      { key: "date", label: "Due date" },
      { key: "status", label: "Status" },
    ],
    documentPrefix: "FI-",
    statuses: ["Open", "Partially Paid", "Cleared", "Overdue", "Disputed"],
    kpis: [
      { key: "fi_receivables", label: "Open Receivables", subtitle: "All company codes", unit: "M EUR", base: 12.7, decimals: 1, kind: "kpi", icon: "currency" },
      { key: "fi_payables", label: "Open Payables", subtitle: "Due within 30 days", unit: "M EUR", base: 8.3, decimals: 1, kind: "kpi", icon: "doc" },
      { key: "fi_dso", label: "Days Sales Outstanding", subtitle: "Rolling average", unit: "days", base: 42, kind: "kpi", icon: "clock" },
      { key: "fi_cash_trend", label: "Cash Flow Trend", subtitle: "Monthly net cash", unit: "K EUR", base: 2_140, kind: "chart", icon: "trend" },
    ],
  },

];

export const MODULE_KEYS = MODULES.map((m) => m.key);

export function findModule(key: string | undefined): ModuleDef | undefined {
  return MODULES.find((m) => m.key === key);
}
