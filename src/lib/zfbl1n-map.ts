/**
 * Maps the SAP ZFBL1N (vendor line items) reply into `public.zfbl1n_items` rows.
 * Each successful non-empty run replaces the snapshot; duplicate lines
 * (company + year + document + line item) are dropped.
 */
import { sapIsoDate } from "./vendor-ageing-map";

const TEXT = ["bukrs", "belnr", "blart", "bschl", "bstat", "augbl", "lifnr", "prctr", "hkont", "txt50", "gsber", "umskz", "koart", "shkzg", "waers", "hwaer", "xblnr", "zuonr", "sgtxt", "ebeln", "kostl", "werks", "ktext", "jamon"];
const DATES = ["budat", "bldat", "faedt", "augdt"];
const INTS = ["gjahr", "buzei", "verzn", "monat"];

export function isZfbl1nEndpoint(name: string): boolean {
  return /zfbl1n|fbl1n|vendorlineitem/.test((name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase());
}
const text = (v: unknown) => { if (v == null || typeof v === "object") return null; const s = String(v).trim(); return s || null; };
const num = (v: unknown) => { if (v == null || v === "") return null; const s = String(v).trim().replace(/,/g, ""); const neg = s.endsWith("-"); const n = Number(neg ? s.slice(0, -1) : s); return Number.isFinite(n) ? (neg ? -n : n) : null; };
/** Case-insensitive field read (SAP may send upper or lower case keys). */
function pick(raw: Record<string, unknown>, k: string) { return raw[k] ?? raw[k.toUpperCase()]; }

export function mapZfbl1nPayload(payload: unknown, endpointName: string, now = new Date()) {
  const obj = (payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {}) as Record<string, unknown>;
  const src = (Array.isArray(payload) ? payload : ["items", "ITEMS", "DATA", "data"].map((k) => obj[k]).find(Array.isArray) ?? []) as Record<string, unknown>[];
  const syncedAt = now.toISOString();
  const rows: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  let invalid = 0, duplicates = 0;
  for (const raw of src) {
    if (!raw || typeof raw !== "object" || !text(pick(raw, "belnr"))) { invalid++; continue; }
    const row: Record<string, unknown> = { source_endpoint: endpointName, synced_at: syncedAt };
    for (const k of TEXT) row[k] = text(pick(raw, k));
    for (const k of DATES) row[k] = sapIsoDate(pick(raw, k));
    for (const k of INTS) { const n = num(pick(raw, k)); row[k] = n == null ? null : Math.trunc(n); }
    row["lifnr"] = row["lifnr"] ?? text(pick(raw, "konto")) ?? text(pick(raw, "lifnr1"));
    row["name1"] = text(pick(raw, "namek")) ?? text(pick(raw, "zzvenName")) ?? text(pick(raw, "name1"));
    row["dmshb"] = num(pick(raw, "dmshb")) ?? 0;
    row["wrshb"] = num(pick(raw, "wrshb"));
    const key = `${row["bukrs"]}|${row["gjahr"]}|${row["belnr"]}|${row["buzei"]}`;
    if (seen.has(key)) { duplicates++; continue; }
    seen.add(key); rows.push(row);
  }
  return { received: src.length, rows, invalid, duplicates };
}

/** Scheduled runs (or an empty saved date) use today as OPEN_AT_KEY_DATE (YYYYMMDD). */
export function withZfbl1nPayload(raw: string | null | undefined, now: Date = new Date(), scheduled = false): string | undefined {
  if (!raw || !raw.trim()) return raw ?? undefined;
  try {
    const obj = { ...(JSON.parse(raw) as Record<string, unknown>) };
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    if (String(obj["OPEN_ITEMS"] ?? "").toUpperCase() === "X" && (scheduled || !/^\d{8}$/.test(String(obj["OPEN_AT_KEY_DATE"] ?? "")))) obj["OPEN_AT_KEY_DATE"] = ymd;
    return JSON.stringify(obj);
  } catch { return raw; }
}
