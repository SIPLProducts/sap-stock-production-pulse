import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ZfFilters = {
  vendor_from: string; vendor_to: string; bukrs_from: string; bukrs_to: string; prctr_from: string; prctr_to: string;
  status: "open" | "cleared" | "all"; key_date: string; types: string[]; post_from: string; post_to: string;
};
export const ZF_EMPTY: ZfFilters = { vendor_from: "", vendor_to: "", bukrs_from: "", bukrs_to: "", prctr_from: "", prctr_to: "", status: "all", key_date: "", types: [], post_from: "", post_to: "" };
export type NV = { name: string; value: number };
export type ZfSummary = {
  net: number; debit: number; credit: number; overdue: number; notDue: number; vendors: number; lines: number;
  minDate: string | null; maxDate: string | null; lastSync: string | null;
  buckets: NV[]; docTypes: NV[]; vendorsTop: NV[]; pcTop: NV[]; glTop: NV[]; company: NV[]; months: NV[];
};
export type ZfRow = { bukrs: string; lifnr: string; name1: string; belnr: string; buzei: number; blart: string; budat: string; bldat: string; faedt: string; verzn: number; dmshb: number; waers: string; prctr: string; hkont: string; txt50: string; zuonr: string; sgtxt: string; augbl: string; augdt: string };
type Opt = { value: string; label: string };

const rpc = supabase.rpc as unknown as (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
const n = (v: unknown) => Number(v) || 0;
const list = (v: unknown): NV[] => (Array.isArray(v) ? v : []).map((d: { name?: unknown; value?: unknown }) => ({ name: String(d.name ?? ""), value: n(d.value) }));

export function toSummary(d: Record<string, unknown>): ZfSummary {
  return {
    net: n(d["net"]), debit: n(d["debit"]), credit: n(d["credit"]), overdue: n(d["overdue"]), notDue: n(d["notDue"]), vendors: n(d["vendors"]), lines: n(d["lines"]),
    minDate: (d["minDate"] as string) ?? null, maxDate: (d["maxDate"] as string) ?? null, lastSync: (d["lastSync"] as string) ?? null,
    buckets: list(d["buckets"]), docTypes: list(d["docTypes"]), vendorsTop: list(d["vendorsTop"]), pcTop: list(d["pcTop"]), glTop: list(d["glTop"]), company: list(d["company"]), months: list(d["months"]),
  };
}
export async function getZfSummary(f: Partial<ZfFilters>): Promise<ZfSummary> {
  const { data, error } = await rpc("zfbl1n_summary", { _f: f });
  if (error) throw new Error(`Unable to load ZFBL1N: ${error.message}`);
  return toSummary((data ?? {}) as Record<string, unknown>);
}
export async function getZfPage(f: Partial<ZfFilters>, search: string, offset: number, limit: number) {
  const { data, error } = await rpc("zfbl1n_page", { _f: f, _search: search, _offset: offset, _limit: limit });
  if (error) throw new Error(`Unable to load ZFBL1N lines: ${error.message}`);
  const d = (data ?? {}) as { total?: number; sum?: number; rows?: ZfRow[] };
  return { total: n(d.total), sum: n(d.sum), rows: d.rows ?? [] };
}
export async function getZfOptions(): Promise<{ vendors: Opt[]; bukrs: Opt[]; prctr: Opt[] }> {
  const { data, error } = await rpc("zfbl1n_options");
  if (error) throw new Error(error.message);
  const d = (data ?? {}) as Record<string, Opt[]>;
  return { vendors: d["vendors"] ?? [], bukrs: d["bukrs"] ?? [], prctr: d["prctr"] ?? [] };
}
export const zfSummaryQuery = (f: Partial<ZfFilters> = {}) => queryOptions({ queryKey: ["zfbl1n", "summary", f], queryFn: () => getZfSummary(f), staleTime: Infinity, refetchOnWindowFocus: false });
export const zfOptionsQuery = queryOptions({ queryKey: ["zfbl1n", "options"], queryFn: getZfOptions, staleTime: Infinity, refetchOnWindowFocus: false });
/** Only filters with a value are sent, so the default view shares one cache entry with the launchpad. */
export function activeFilters(f: ZfFilters): Partial<ZfFilters> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(f)) if (Array.isArray(v) ? v.length : v && v !== "all") out[k] = v;
  return out as Partial<ZfFilters>;
}
