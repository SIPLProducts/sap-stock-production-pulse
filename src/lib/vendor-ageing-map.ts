/**
 * Maps the SAP ZFI_VAG (Vendor Ageing) response into `public.vendor_ageing` rows.
 * SAP returns the complete open-item set for the key date, so each successful
 * non-empty run replaces the whole snapshot (no unique document key exists).
 */
import { orderBookNum } from "./order-book-map";

const TEXT = ["LIFNR", "NAME1", "J_1IPANNO", "MINDK_DESC", "BELNR", "BLART", "BUKRS", "PRCTR", "SGTXT", "T_VBELN", "EBELN", "HKONT", "TXT50", "UMSKZ",
  "IFSC", "BANKN", "BANKA", "KOINH", "SEGMENT", "SEGMENT_TEXT", "PRCTR_TEXT", "MSME_NO", "CERT_ID", "STATUS", "REG_CITY", "MAIN_CERT", "ZTERM", "TEXT1", "LFBNR", "BELNR1"];
const NUM = ["WRBTR", "D10", "D20", "D30", "D40", "D50", "D60", "D70", "D80", "D90"];
const INT = ["DAYS", "GJAHR"];
const DATES = ["BLDAT", "BUDAT", "BEDAT", "NET_DUE_DATE", "VALID_FROM", "VALID_TO", "BUDAT_MKPF"];

export function isVendorAgeingEndpoint(name: string): boolean {
  const n = (name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return n.includes("vendorageing") || n.includes("vendoraging") || n.includes("zfivag");
}
const text = (v: unknown) => { if (v == null || typeof v === "object") return null; const s = String(v).trim(); return s || null; };

export function mapVendorAgeingPayload(payload: unknown, endpointName: string, now = new Date(), pcText: string | null = null) {
  const obj = (payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {}) as Record<string, unknown>;
  const source = (Array.isArray(payload) ? payload : Array.isArray(obj["DATA"]) ? obj["DATA"] : Array.isArray(obj["data"]) ? obj["data"] : []) as Record<string, unknown>[];
  const keyDate = sapIsoDate(obj["KEY_DATE"]), runDate = sapIsoDate(obj["RUN_DATE"]);
  const syncedAt = now.toISOString();
  const rows: Record<string, unknown>[] = [];
  let invalid = 0;
  for (const raw of source) {
    if (!raw || typeof raw !== "object" || !text(raw["LIFNR"])) { invalid++; continue; }
    const row: Record<string, unknown> = { key_date: keyDate, run_date: runDate, raw, source_endpoint: endpointName, synced_at: syncedAt, pc_text: pcText };
    for (const k of TEXT) row[k.toLowerCase()] = text(raw[k]);
    for (const k of NUM) row[k.toLowerCase()] = orderBookNum(raw[k]);
    for (const k of INT) { const n = orderBookNum(raw[k]); row[k.toLowerCase()] = n == null ? null : Math.trunc(n); }
    for (const k of DATES) row[k.toLowerCase()] = sapIsoDate(raw[k]);
    rows.push(row);
  }
  return { received: source.length, rows, invalid, duplicates: 0 };
}

/** S_KDATE = today (YYYYMMDD) unless a valid date is saved on a manual run; exactly one of R1/R2/R3 is "X" (default R1 = Due Date). */
export function withVendorAgeingPayload(raw: string | null | undefined, now: Date = new Date(), scheduled = false): string | undefined {
  if (!raw || !raw.trim()) return raw ?? undefined;
  try {
    const obj = { ...(JSON.parse(raw) as Record<string, unknown>) };
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    if (scheduled || !/^\d{8}$/.test(String(obj["S_KDATE"] ?? ""))) obj["S_KDATE"] = ymd;
    const picked = ["R1", "R2", "R3"].find((k) => String(obj[k] ?? "").toUpperCase() === "X") ?? "R1";
    for (const k of ["R1", "R2", "R3"]) obj[k] = k === picked ? "X" : "";
    return JSON.stringify(obj);
  } catch { return raw; }
}

function text0(v: unknown) { if (v == null || typeof v === "object") return null; const s = String(v).trim(); return s || null; }
export function sapIsoDate(v: unknown): string | null {
  const s = text0(v);
  if (!s || /^0+$/.test(s.replace(/\D/g, ""))) return null;
  let m = s.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  return m ? `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}` : null;
}

/** Every Vendor Ageing sync calls SAP once per basis, in this order; each row stores its basis label in pc_text. */
export const VA_BASES = [["R1", "Due Date"], ["R2", "Posting Date"], ["R3", "GRN Date"]] as const;
export type VaBasisKey = (typeof VA_BASES)[number][0];
/** Progress text saved on the running sync row, e.g. "Posting Date (2/3)". */
export function vendorAgeingStepLabel(label: string, index: number) { return `${label} (${index + 1}/${VA_BASES.length})`; }

/** Sets exactly one of R1/R2/R3 to "X" for the given basis call. */
export function withVendorAgeingBasis(raw: string | undefined, key: VaBasisKey): string | undefined {
  if (!raw || !raw.trim()) return raw;
  try {
    const obj = { ...(JSON.parse(raw) as Record<string, unknown>) };
    for (const k of ["R1", "R2", "R3"]) obj[k] = k === key ? "X" : "";
    return JSON.stringify(obj);
  } catch { return raw; }
}

/** 52k-row snapshots: 2,000-row batches, 4 in flight, instead of one 500-row batch at a time. */
export async function insertVendorAgeingChunks<T>(rows: T[], insert: (chunk: T[]) => Promise<void>, size = 2000, concurrency = 4): Promise<void> {
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size));
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, chunks.length) }, async () => {
    while (next < chunks.length) await insert(chunks[next++]!);
  }));
}
