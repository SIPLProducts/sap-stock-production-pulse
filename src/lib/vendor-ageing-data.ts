import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Age buckets D10–D90 follow the payload day limits D1–D9 (30/90/120/180/365/731/1096/1826). */
export const VA_BUCKETS = ["0-30", "31-90", "91-120", "121-180", "181-365", "1-2 Yr", "2-3 Yr", "3-5 Yr", ">5 Yr"] as const;

export type VaRow = {
  vendor: string; vendorName: string; pan: string; msmeDesc: string; msmeNo: string; doc: string; amount: number; days: number; docType: string;
  docDate: string; postDate: string; dueDate: string; bukrs: string; prctr: string; prctrText: string; gl: string; glText: string;
  segment: string; text: string; ref: string; po: string; keyDate: string; buckets: number[]; syncedAt: string;
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
    segment: t(r["segment_text"]) || t(r["segment"]), text: t(r["sgtxt"]), ref: t(r["t_vbeln"]), po: t(r["ebeln"]), keyDate: t(r["key_date"]),
    buckets: ["d10", "d20", "d30", "d40", "d50", "d60", "d70", "d80", "d90"].map((k) => -n(r[k])), syncedAt: t(r["synced_at"]),
  };
}
export const isMsme = (r: VaRow) => !!r.msmeNo || (!!r.msmeDesc && !/not/i.test(r.msmeDesc));

export function vaTotals(rows: VaRow[]) {
  const buckets = VA_BUCKETS.map(() => 0);
  let total = 0, msme = 0;
  for (const r of rows) { total += r.amount; if (isMsme(r)) msme += r.amount; r.buckets.forEach((v, i) => { buckets[i]! += v; }); }
  return { total, msme, buckets, vendors: new Set(rows.map((r) => r.vendor)).size, lines: rows.length };
}
export function vaGroup(rows: VaRow[], key: (r: VaRow) => string) {
  const m = new Map<string, number>();
  for (const r of rows) { const k = key(r); if (!k) continue; m.set(k, (m.get(k) ?? 0) + r.amount); }
  return [...m].map(([name, value]) => ({ name, value })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
}
export function vaLastSync(rows: VaRow[]) { let m = ""; for (const r of rows) if (r.syncedAt > m) m = r.syncedAt; return m || null; }

const COLS = "id,lifnr,name1,j_1ipanno,mindk_desc,msme_no,belnr,wrbtr,days,blart,bldat,budat,net_due_date,bukrs,prctr,prctr_text,hkont,txt50,segment,segment_text,sgtxt,t_vbeln,ebeln,key_date,d10,d20,d30,d40,d50,d60,d70,d80,d90,synced_at";
const PAGE = 1000;
export async function getVendorAgeing(): Promise<VaRow[]> {
  const out: Rec[] = [];
  let after = 0;
  for (;;) {
    const { data, error } = await supabase.from("vendor_ageing").select(COLS).order("id").gt("id", after).limit(PAGE);
    if (error) throw new Error(`Unable to load Vendor Ageing: ${error.message}`);
    const list = (data ?? []) as unknown as Rec[];
    out.push(...list);
    if (list.length < PAGE) break;
    after = Number(list[list.length - 1]!["id"]);
  }
  return out.map(toVaRow);
}
export const vendorAgeingQuery = queryOptions({ queryKey: ["vendor-ageing", "v1"], queryFn: getVendorAgeing, staleTime: Infinity, refetchOnWindowFocus: false });
