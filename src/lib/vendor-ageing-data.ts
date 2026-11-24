import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Age buckets D10–D90 follow the payload day limits D1–D9 (30/90/120/180/365/731/1096/1826). */
export const VA_BUCKETS = ["0-30", "31-90", "91-120", "121-180", "181-365", "1-2 Yr", "2-3 Yr", "3-5 Yr", ">5 Yr"] as const;

export type VaRow = {
  vendor: string; vendorName: string; pan: string; msmeDesc: string; msmeNo: string; doc: string; amount: number; days: number; docType: string;
  docDate: string; postDate: string; dueDate: string; bukrs: string; prctr: string; prctrText: string; gl: string; glText: string;
  segment: string; text: string; ref: string; po: string; keyDate: string; pcText: string; buckets: number[]; syncedAt: string;
};
type Rec = Record<string, unknown>;
const t = (v: unknown) => (v == null ? "" : String(v)).trim();
const n = (v: unknown) => Number(v) || 0;
/** SAP payables are credits (negative); the screen shows outstanding as positive. */
export function toVaRow(r: Rec): VaRow {
  return {
    vendor: t(r["lifnr"]), vendorName: t(r["name1"]) || t(r["lifnr"]), pan: t(r["j_1ipanno"]), msmeDesc: t(r["mindk_desc"]), msmeNo: t(r["msme_no"]),
    doc: t(r["belnr"]), amount: -n(r["wrbtr"]), days: n(r["days"]), docType: t(r["blart"]), docDate: t(r["bldat"]), postDate: t(r["budat"]), dueDate: t(r["net_due_date"]),
    bukrs: t(r["bukrs"]), prctr: t(r["prctr"]), prctrText: t(r["prctr_text"]) || t(r["prctr"]), gl: t(r["hkont"]), glText: t(r["txt50"]) || t(r["hkont"]),
    segment: t(r["segment_text"]) || t(r["segment"]), text: t(r["sgtxt"]), ref: t(r["t_vbeln"]), po: t(r["ebeln"]), keyDate: t(r["key_date"]), pcText: t(r["pc_text"]),
    buckets: ["d10", "d20", "d30", "d40", "d50", "d60", "d70", "d80", "d90"].map((k) => -n(r[k])), syncedAt: t(r["synced_at"]),
  };
}
export const isMsme = (r: VaRow) => !!r.msmeNo || (!!r.msmeDesc && !/not/i.test(r.msmeDesc));

export function vaTotals(rows: VaRow[]) {
  const buckets = VA_BUCKETS.map(() => 0);
  let total = 0, msme = 0, payable = 0, advances = 0, msmeOverdue45 = 0;
  for (const r of rows) {
    total += r.amount; if (isMsme(r)) msme += r.amount;
    if (r.amount > 0) { payable += r.amount; if (isMsme(r) && r.days > 45) msmeOverdue45 += r.amount; r.buckets.forEach((v, i) => { buckets[i]! += v; }); }
    else advances -= r.amount;
  }
  return { total, msme, payable, advances, msmeOverdue45, buckets, vendors: new Set(rows.map((r) => r.vendor)).size, lines: rows.length };
}
export function vaGroup(rows: VaRow[], key: (r: VaRow) => string) {
  const m = new Map<string, number>();
  for (const r of rows) { const k = key(r); if (!k) continue; m.set(k, (m.get(k) ?? 0) + r.amount); }
  return [...m].map(([name, value]) => ({ name, value })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
}
/** Micro / Small / Medium from SAP MSME description; anything else is Non-MSME. */
export function vaMsmeClass(r: VaRow) { const d = r.msmeDesc.toLowerCase(); return /not/.test(d) ? "Non-MSME" : d.includes("micro") ? "Micro" : d.includes("small") ? "Small" : d.includes("medium") ? "Medium" : "Non-MSME"; }
/** Group payable (positive) or advance (negative, shown positive) lines separately so advances never cancel payables. */
export function vaGroupSplit(rows: VaRow[], key: (r: VaRow) => string, side: "payable" | "advance") {
  const m = new Map<string, number>();
  for (const r of rows) { const v = side === "payable" ? r.amount : -r.amount; if (v <= 0) continue; const k = key(r); if (!k) continue; m.set(k, (m.get(k) ?? 0) + v); }
  return [...m].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
/** Payable value per G/L account split by document type (top G/Ls, top doc types, rest as Others). */
export function vaGlDocSplit(rows: VaRow[], gls = 6, types = 4) {
  const glTop = vaGroupSplit(rows, (r) => r.glText, "payable").slice(0, gls).map((d) => d.name);
  const typeTop = vaGroupSplit(rows, (r) => r.docType, "payable").slice(0, types).map((d) => d.name);
  const keys = [...typeTop, "Others"];
  const out = glTop.map((name) => ({ name, parts: Object.fromEntries(keys.map((k) => [k, 0])) as Record<string, number>, total: 0 }));
  for (const r of rows) { if (r.amount <= 0) continue; const g = out.find((o) => o.name === r.glText); if (!g) continue; const k = typeTop.includes(r.docType) ? r.docType : "Others"; g.parts[k] = (g.parts[k] ?? 0) + r.amount; g.total += r.amount; }
  return { keys, rows: out };
}
export function vaLastSync(rows: VaRow[]) { let m = ""; for (const r of rows) if (r.syncedAt > m) m = r.syncedAt; return m || null; }

const COLS = "id,lifnr,name1,j_1ipanno,mindk_desc,msme_no,belnr,wrbtr,days,blart,bldat,budat,net_due_date,bukrs,prctr,prctr_text,hkont,txt50,segment,segment_text,sgtxt,t_vbeln,ebeln,key_date,pc_text,d10,d20,d30,d40,d50,d60,d70,d80,d90,synced_at";
const PAGE = 1000;
/** Fetches id ranges in parallel (6 at a time) instead of 50+ sequential pages. */
export async function getVendorAgeing(): Promise<VaRow[]> {
  const edge = async (asc: boolean) => {
    const { data, error } = await supabase.from("vendor_ageing").select("id").order("id", { ascending: asc }).limit(1);
    if (error) throw new Error(`Unable to load Vendor Ageing: ${error.message}`);
    return Number((data?.[0] as { id?: number } | undefined)?.id ?? 0);
  };
  const [lo, hi] = await Promise.all([edge(true), edge(false)]);
  if (!lo && !hi) return [];
  const starts: number[] = [];
  for (let s = lo; s <= hi; s += PAGE) starts.push(s);
  const out: Rec[] = [];
  const fetchRange = async (from: number): Promise<void> => {
    let after = from - 1; const end = from + PAGE - 1;
    for (;;) {
      const { data, error } = await supabase.from("vendor_ageing").select(COLS).gt("id", after).lte("id", end).order("id").limit(PAGE);
      if (error) throw new Error(`Unable to load Vendor Ageing: ${error.message}`);
      const list = (data ?? []) as unknown as Rec[];
      out.push(...list);
      if (list.length < PAGE) return;
      after = Number(list[list.length - 1]!["id"]);
    }
  };
  let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => { while (i < starts.length) await fetchRange(starts[i++]!); }));
  out.sort((x, y) => Number(x["id"]) - Number(y["id"]));
  return out.map(toVaRow);
}
export const vendorAgeingQuery = queryOptions({ queryKey: ["vendor-ageing", "v2-basis"], queryFn: getVendorAgeing, staleTime: Infinity, refetchOnWindowFocus: false });

export type VaBasis = "all" | "due" | "post" | "grn";
const VA_LIMITS = [30, 90, 120, 180, 365, 730, 1095, 1825];
/** Re-age rows from the chosen date to the key date; "all" keeps stored SAP buckets. GRN date is not sent by SAP, so "grn" yields no rows. */
export function rebucketByBasis(rows: VaRow[], basis: VaBasis, keyDate: string): VaRow[] {
  if (basis === "all") return rows;
  const out: VaRow[] = [];
  for (const r of rows) {
    const from = basis === "due" ? r.dueDate : basis === "post" ? r.postDate : "";
    const key = r.keyDate || keyDate;
    if (!from || !key) continue;
    const days = Math.round((Date.parse(key) - Date.parse(from)) / 86400000);
    if (Number.isNaN(days)) continue;
    let i = VA_LIMITS.findIndex((l) => days <= l); if (i < 0) i = VA_LIMITS.length;
    const buckets = VA_BUCKETS.map((_, j) => (j === i ? r.amount : 0));
    out.push({ ...r, days, buckets });
  }
  return out;
}

/** Stored SAP basis, never recalculated dates. Untagged older rows remain visible only with All. */
export function filterVendorAgeingBasis(rows: VaRow[], basis: VaBasis): VaRow[] {
  if (basis === "all") return rows;
  const label = { due: "Due Date", post: "Posting Date", grn: "GRN Date" }[basis];
  return rows.filter((r) => r.pcText === label);
}
