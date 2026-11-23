// <define:import.meta.env>
var define_import_meta_env_default = {};

// ../src/lib/order-book-map.ts
function orderBookNum(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v === void 0 || v === null) return 0;
  let s = String(v).trim().replace(/,/g, "");
  if (!s) return 0;
  if (s.endsWith("-")) s = "-" + s.slice(0, -1);
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

// ../src/lib/vendor-ageing-map.ts
var TEXT = [
  "LIFNR",
  "NAME1",
  "J_1IPANNO",
  "MINDK_DESC",
  "BELNR",
  "BLART",
  "BUKRS",
  "PRCTR",
  "SGTXT",
  "T_VBELN",
  "EBELN",
  "HKONT",
  "TXT50",
  "UMSKZ",
  "IFSC",
  "BANKN",
  "BANKA",
  "KOINH",
  "SEGMENT",
  "SEGMENT_TEXT",
  "PRCTR_TEXT",
  "MSME_NO",
  "CERT_ID",
  "STATUS",
  "REG_CITY",
  "MAIN_CERT",
  "ZTERM",
  "TEXT1",
  "LFBNR",
  "BELNR1"
];
var NUM = ["WRBTR", "D10", "D20", "D30", "D40", "D50", "D60", "D70", "D80", "D90"];
var INT = ["DAYS", "GJAHR"];
var DATES = ["BLDAT", "BUDAT", "BEDAT", "NET_DUE_DATE", "VALID_FROM", "VALID_TO", "BUDAT_MKPF"];
function isVendorAgeingEndpoint(name) {
  const n = (name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return n.includes("vendorageing") || n.includes("vendoraging") || n.includes("zfivag");
}
var text = (v) => {
  if (v == null || typeof v === "object") return null;
  const s = String(v).trim();
  return s || null;
};
function mapVendorAgeingPayload(payload, endpointName, now = /* @__PURE__ */ new Date()) {
  const obj = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const source = Array.isArray(payload) ? payload : Array.isArray(obj["DATA"]) ? obj["DATA"] : Array.isArray(obj["data"]) ? obj["data"] : [];
  const keyDate = sapIsoDate(obj["KEY_DATE"]), runDate = sapIsoDate(obj["RUN_DATE"]);
  const syncedAt = now.toISOString();
  const rows = [];
  let invalid = 0;
  for (const raw of source) {
    if (!raw || typeof raw !== "object" || !text(raw["LIFNR"])) {
      invalid++;
      continue;
    }
    const row = { key_date: keyDate, run_date: runDate, raw, source_endpoint: endpointName, synced_at: syncedAt };
    for (const k of TEXT) row[k.toLowerCase()] = text(raw[k]);
    for (const k of NUM) row[k.toLowerCase()] = orderBookNum(raw[k]);
    for (const k of INT) {
      const n = orderBookNum(raw[k]);
      row[k.toLowerCase()] = n == null ? null : Math.trunc(n);
    }
    for (const k of DATES) row[k.toLowerCase()] = sapIsoDate(raw[k]);
    rows.push(row);
  }
  return { received: source.length, rows, invalid, duplicates: 0 };
}
function withVendorAgeingPayload(raw, now = /* @__PURE__ */ new Date(), scheduled = false) {
  if (!raw || !raw.trim()) return raw ?? void 0;
  try {
    const obj = { ...JSON.parse(raw) };
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    if (scheduled || !/^\d{8}$/.test(String(obj["S_KDATE"] ?? ""))) obj["S_KDATE"] = ymd;
    const picked = ["R1", "R2", "R3"].find((k) => String(obj[k] ?? "").toUpperCase() === "X") ?? "R1";
    for (const k of ["R1", "R2", "R3"]) obj[k] = k === picked ? "X" : "";
    return JSON.stringify(obj);
  } catch {
    return raw;
  }
}
function text0(v) {
  if (v == null || typeof v === "object") return null;
  const s = String(v).trim();
  return s || null;
}
function sapIsoDate(v) {
  const s = text0(v);
  if (!s || /^0+$/.test(s.replace(/\D/g, ""))) return null;
  let m = s.match(/^(\d{4})-?(\d{2})-?(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
}

// ../src/lib/zfbl1n-map.ts
var TEXT2 = ["bukrs", "belnr", "blart", "bschl", "bstat", "augbl", "lifnr", "prctr", "hkont", "txt50", "gsber", "umskz", "koart", "shkzg", "waers", "hwaer", "xblnr", "zuonr", "sgtxt", "ebeln", "kostl", "werks", "ktext", "jamon"];
var DATES2 = ["budat", "bldat", "faedt", "augdt"];
var INTS = ["gjahr", "buzei", "verzn", "monat"];
function isZfbl1nEndpoint(name) {
  return /zfbl1n|fbl1n|vendorlineitem/.test((name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase());
}
var text2 = (v) => {
  if (v == null || typeof v === "object") return null;
  const s = String(v).trim();
  return s || null;
};
var num = (v) => {
  if (v == null || v === "") return null;
  const s = String(v).trim().replace(/,/g, "");
  const neg = s.endsWith("-");
  const n = Number(neg ? s.slice(0, -1) : s);
  return Number.isFinite(n) ? neg ? -n : n : null;
};
function pick(raw, k) {
  return raw[k] ?? raw[k.toUpperCase()];
}
function mapZfbl1nPayload(payload, endpointName, now = /* @__PURE__ */ new Date()) {
  const obj = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const src = Array.isArray(payload) ? payload : ["items", "ITEMS", "DATA", "data"].map((k) => obj[k]).find(Array.isArray) ?? [];
  const syncedAt = now.toISOString();
  const rows = [];
  const seen = /* @__PURE__ */ new Set();
  let invalid = 0, duplicates = 0;
  for (const raw of src) {
    if (!raw || typeof raw !== "object" || !text2(pick(raw, "belnr"))) {
      invalid++;
      continue;
    }
    const row = { source_endpoint: endpointName, synced_at: syncedAt };
    for (const k of TEXT2) row[k] = text2(pick(raw, k));
    for (const k of DATES2) row[k] = sapIsoDate(pick(raw, k));
    for (const k of INTS) {
      const n = num(pick(raw, k));
      row[k] = n == null ? null : Math.trunc(n);
    }
    row["lifnr"] = row["lifnr"] ?? text2(pick(raw, "konto")) ?? text2(pick(raw, "lifnr1"));
    row["name1"] = text2(pick(raw, "namek")) ?? text2(pick(raw, "zzvenName")) ?? text2(pick(raw, "name1"));
    row["dmshb"] = num(pick(raw, "dmshb")) ?? 0;
    row["wrshb"] = num(pick(raw, "wrshb"));
    const key = `${row["bukrs"]}|${row["gjahr"]}|${row["belnr"]}|${row["buzei"]}`;
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    rows.push(row);
  }
  return { received: src.length, rows, invalid, duplicates };
}
function withZfbl1nPayload(raw, now = /* @__PURE__ */ new Date(), scheduled = false) {
  if (!raw || !raw.trim()) return raw ?? void 0;
  try {
    const obj = { ...JSON.parse(raw) };
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    if (String(obj["OPEN_ITEMS"] ?? "").toUpperCase() === "X" && (scheduled || !/^\d{8}$/.test(String(obj["OPEN_AT_KEY_DATE"] ?? "")))) obj["OPEN_AT_KEY_DATE"] = ymd;
    return JSON.stringify(obj);
  } catch {
    return raw;
  }
}

// ../src/lib/current-stock-map.ts
var CURRENT_STOCK_TEXT_FIELDS = ["LGOBE", "MAKTX", "MEINS", "MTART", "ROWNO", "SHELFNO", "RACKNO", "BINNO"];
var CURRENT_STOCK_NUMERIC_FIELDS = ["LABST", "WLABS", "INSME", "WINSM", "SPEME", "WSPEM", "TRAME", "WTRAM"];
function isCurrentStockEndpoint(name) {
  const n = (name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return n.includes("currentstock") || n === "zcurrstk" || n.includes("zdprmisreport");
}
function pick2(raw, key) {
  if (raw[key] !== void 0) return raw[key];
  const real = Object.keys(raw).find((k) => k.toLowerCase() === key.toLowerCase());
  return real ? raw[real] : void 0;
}
function text3(v) {
  if (v === void 0 || v === null || typeof v === "object") return null;
  const s = String(v).trim();
  return s ? s : null;
}
function extractRows(payload) {
  if (Array.isArray(payload)) return payload.filter((r) => r && typeof r === "object");
  if (payload && typeof payload === "object") {
    const obj = payload;
    for (const key of ["data", "DATA", "results", "items", "value"]) if (Array.isArray(obj[key])) return extractRows(obj[key]);
  }
  return [];
}
function mapCurrentStockPayload(payload, endpointName, now = /* @__PURE__ */ new Date()) {
  const source = extractRows(payload);
  const syncedAt = now.toISOString();
  const byKey = /* @__PURE__ */ new Map();
  let invalid = 0;
  for (const raw of source) {
    const matnr = text3(pick2(raw, "MATNR"));
    if (!matnr) {
      invalid++;
      continue;
    }
    const werks = text3(pick2(raw, "WERKS")) ?? "", lgort = text3(pick2(raw, "LGORT")) ?? "", charg = text3(pick2(raw, "CHARG")) ?? "";
    const row = { matnr, werks, lgort, charg, raw, source_endpoint: endpointName, synced_at: syncedAt };
    for (const k of CURRENT_STOCK_TEXT_FIELDS) row[k.toLowerCase()] = text3(pick2(raw, k));
    for (const k of CURRENT_STOCK_NUMERIC_FIELDS) row[k.toLowerCase()] = orderBookNum(pick2(raw, k));
    byKey.set(`${matnr}|${werks}|${lgort}|${charg}`, row);
  }
  const rows = [...byKey.values()];
  return { received: source.length, rows, invalid, duplicates: source.length - invalid - rows.length };
}

// ../src/lib/user-dropdown-map.ts
function isUserDropdownEndpoint(endpointName) {
  return endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase().includes("usermanagementdropdown");
}
function text4(v) {
  if (v === void 0 || v === null) return null;
  const s = String(v).trim();
  return s ? s : null;
}
function field(raw, key) {
  if (raw[key] !== void 0) return raw[key];
  const real = Object.keys(raw).find((k) => k.toLowerCase() === key.toLowerCase());
  return real ? raw[real] : void 0;
}
function list(obj, key) {
  const v = field(obj, key);
  return Array.isArray(v) ? v.filter((r) => r && typeof r === "object") : [];
}
function mapUserDropdownPayload(payload, endpointName, now = /* @__PURE__ */ new Date()) {
  let root = {};
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    root = payload;
    const inner = field(root, "data");
    if (inner && typeof inner === "object" && !Array.isArray(inner)) root = inner;
  }
  const syncedAt = now.toISOString();
  const byKey = /* @__PURE__ */ new Map();
  let received = 0;
  let invalid = 0;
  const add = (category, rows2, codeKey, nameKey) => {
    for (const raw of rows2) {
      received++;
      const code = text4(field(raw, codeKey));
      if (!code) {
        invalid++;
        continue;
      }
      byKey.set(`${category}|${code}`, {
        category,
        code,
        name: text4(field(raw, nameKey)),
        raw,
        source_endpoint: endpointName,
        synced_at: syncedAt
      });
    }
  };
  add("plant", list(root, "plants"), "plant", "plantName");
  add("profit_center", list(root, "profitCenters"), "profitCenter", "profitCenterName");
  const rows = [...byKey.values()];
  return { received, rows, invalid, duplicates: received - invalid - rows.length };
}

// ../src/lib/payload-fields.ts
function stripJsonComments(raw) {
  return (raw ?? "").split(/\r?\n/).filter((line) => !line.trim().startsWith("//")).join("\n").replace(/,(\s*[}\]])/g, "$1");
}

// ../src/lib/sit-map.ts
function isSitEndpoint(name) {
  const n = (name ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  return n.includes("salesintransit") || n === "sit" || n === "zsit" || /(^|[^a-z])z?_?sit([^a-z]|$)/i.test(name ?? "");
}

// ../src/lib/sap-pull-shared.ts
function salvageTruncatedArray(text5) {
  const trimmed = text5.trimStart();
  if (!trimmed.startsWith("[")) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let lastComplete = -1;
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      if (inString) escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{" || ch === "[") depth += 1;
    else if (ch === "}" || ch === "]") {
      depth -= 1;
      if (depth === 1) lastComplete = i;
    }
  }
  if (lastComplete < 0) return null;
  try {
    const rows = JSON.parse(`${trimmed.slice(0, lastComplete + 1)}]`);
    return Array.isArray(rows) && rows.length ? rows : null;
  } catch {
    return null;
  }
}
function extractEmbeddedBody(text5) {
  const marker = '"body":"';
  const start = text5.indexOf(marker);
  if (start < 0) return null;
  const raw = text5.slice(start + marker.length);
  try {
    const safe = raw.replace(/\\$/, "");
    return JSON.parse(`"${safe.replace(/"$/, "")}"`);
  } catch {
    return raw.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\t/g, "	").replace(/\\\\/g, "\\");
  }
}
var sapDateOf = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
function postingWindow(range, now = /* @__PURE__ */ new Date()) {
  const to = new Date(now);
  const from = new Date(now);
  switch (range) {
    case "today":
      break;
    case "yesterday":
      from.setDate(from.getDate() - 1);
      to.setDate(to.getDate() - 1);
      break;
    case "last7d":
      from.setDate(from.getDate() - 7);
      break;
    case "last1m":
      from.setMonth(from.getMonth() - 1);
      break;
    case "last6m":
      from.setMonth(from.getMonth() - 6);
      break;
    case "last1y":
      from.setFullYear(from.getFullYear() - 1);
      break;
    case "fytd": {
      const y = to.getMonth() >= 3 ? to.getFullYear() : to.getFullYear() - 1;
      from.setFullYear(y, 3, 1);
      break;
    }
    default:
      return null;
  }
  return { from: sapDateOf(from), to: sapDateOf(to) };
}
function withPostingDates(raw, range) {
  if (!raw || !raw.trim()) return raw ?? void 0;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return raw;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw;
  const obj = parsed;
  const window = postingWindow(range);
  if (window) {
    if ("BUDAT_F" in obj) obj["BUDAT_F"] = window.from;
    if ("BUDAT_T" in obj) obj["BUDAT_T"] = window.to;
    return JSON.stringify(obj);
  }
  const sapDate = (daysAgo) => {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - daysAgo);
    return sapDateOf(d);
  };
  const valid = (v) => /^\d{8}$/.test(String(v ?? "").trim());
  if ("BUDAT_F" in obj && !valid(obj["BUDAT_F"])) obj["BUDAT_F"] = sapDate(7);
  if ("BUDAT_T" in obj && !valid(obj["BUDAT_T"])) obj["BUDAT_T"] = sapDate(0);
  return JSON.stringify(obj);
}
function withOpenSalesOrdersDate(raw, now = /* @__PURE__ */ new Date(), useCurrentDate = false) {
  if (!raw || !raw.trim()) return raw ?? void 0;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw;
    const obj = parsed;
    const savedDate = String(obj["fkdat"] ?? "").trim();
    return JSON.stringify({
      ...obj,
      fkdat: useCurrentDate || !/^\d{8}$/.test(savedDate) ? sapDateOf(now) : savedDate
    });
  } catch {
    return raw;
  }
}
function isOpenSalesOrdersEndpoint(endpointName) {
  return endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase() === "opensalesorders";
}
function withOrderBookDates(raw, range, now = /* @__PURE__ */ new Date()) {
  if (!raw || !raw.trim()) return raw ?? void 0;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw;
    const obj = { ...parsed };
    const window = postingWindow(range, now);
    const valid = (v) => /^\d{8}$/.test(String(v ?? "").trim());
    if (window) {
      obj["ERDAT_F"] = window.from;
      obj["ERDAT_T"] = window.to;
    } else {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      if (!valid(obj["ERDAT_F"])) obj["ERDAT_F"] = sapDateOf(from);
      if (!valid(obj["ERDAT_T"])) obj["ERDAT_T"] = sapDateOf(now);
    }
    return JSON.stringify(obj);
  } catch {
    return raw;
  }
}
function withSitDates(raw, range, now = /* @__PURE__ */ new Date(), scheduled = false) {
  if (!raw || !raw.trim()) return raw ?? void 0;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw;
    const obj = { ...parsed };
    const window = postingWindow(range, now);
    if (window) {
      obj["FKDAT_F"] = window.from;
      obj["FKDAT_T"] = range === "today" ? "" : window.to;
    }
    const from = String(obj["FKDAT_F"] ?? "").trim();
    if (scheduled || !/^\d{8}$/.test(from)) obj["FKDAT_F"] = sapDateOf(now);
    if (!String(obj["FKDAT_T"] ?? "").trim()) delete obj["FKDAT_T"];
    return JSON.stringify(obj);
  } catch {
    return raw;
  }
}
function withSalesRegisterMode(raw, scheduled = false, range, now = /* @__PURE__ */ new Date()) {
  try {
    const parsed = raw && raw.trim() ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw ?? void 0;
    const obj = {};
    for (const [k, v] of Object.entries(parsed)) if (k.toLowerCase() !== "mode") obj[k] = v;
    const window = postingWindow(range, now);
    if (window) for (const k of Object.keys(obj)) {
      if (/^fkdat_f$/i.test(k)) obj[k] = window.from;
      else if (/^fkdat_t$/i.test(k)) obj[k] = window.to;
    }
    obj["MODE"] = scheduled ? "DAILY" : "ONETIME";
    return JSON.stringify(obj);
  } catch {
    return raw ?? void 0;
  }
}
function withOpenPoDates(raw, range, now = /* @__PURE__ */ new Date()) {
  if (!raw || !raw.trim()) return raw ?? void 0;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw;
    const obj = { ...parsed };
    const bf = Object.keys(obj).find((k) => k.toUpperCase() === "BEDAT_FROM");
    if (bf) {
      const bt = Object.keys(obj).find((k) => k.toUpperCase() === "BEDAT_TO") ?? "BEDAT_TO";
      const w = postingWindow(range, now);
      const ok = (v) => /^\d{8}$/.test(String(v ?? "").trim());
      const fyStart = `${now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1}0401`;
      if (w) {
        obj[bf] = range === "today" ? sapDateOf(now) : w.from;
        obj[bt] = w.to;
      } else {
        if (!ok(obj[bf])) obj[bf] = fyStart;
        if (!ok(obj[bt])) obj[bt] = sapDateOf(now);
      }
      return JSON.stringify(obj);
    }
    const docKey = Object.keys(obj).find((k) => k.toLowerCase() === "document_date") ?? "DOCUMENT_DATE";
    const doc = obj[docKey] && typeof obj[docKey] === "object" ? { ...obj[docKey] } : {};
    const lower = docKey === docKey.toLowerCase();
    const fromKey = Object.keys(doc).find((k) => k.toLowerCase() === "from_date") ?? (lower ? "from_date" : "FROM_DATE");
    const toKey = Object.keys(doc).find((k) => k.toLowerCase() === "to_date") ?? (lower ? "to_date" : "TO_DATE");
    const window = postingWindow(range, now);
    const valid = (v) => /^\d{8}$/.test(String(v ?? "").trim());
    if (window) {
      doc[fromKey] = range === "today" ? "" : window.from;
      doc[toKey] = window.to;
    } else {
      if (!valid(doc[fromKey])) doc[fromKey] = "";
      if (!valid(doc[toKey])) doc[toKey] = sapDateOf(now);
    }
    obj[docKey] = doc;
    return JSON.stringify(obj);
  } catch {
    return raw;
  }
}
function withDprDates(raw, range, now = /* @__PURE__ */ new Date()) {
  if (!raw || !raw.trim()) return raw ?? void 0;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return raw;
    const obj = { ...parsed };
    const iso = (d) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    const valid = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v ?? "").trim());
    delete obj["BUDAT_F"];
    delete obj["BUDAT_T"];
    const window = postingWindow(range, now);
    if (window) {
      obj["FROMDT"] = iso(window.from);
      obj["TODT"] = iso(window.to);
    } else {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      if (!valid(obj["FROMDT"])) obj["FROMDT"] = iso(sapDateOf(from));
      if (!valid(obj["TODT"])) obj["TODT"] = iso(sapDateOf(now));
    }
    return JSON.stringify(obj);
  } catch {
    return raw;
  }
}
function withEndpointDates(endpointName, raw, range, now = /* @__PURE__ */ new Date(), scheduled = false) {
  if (raw && /^\s*\/\//m.test(raw)) raw = stripJsonComments(raw);
  if (/openpurchaseorder|^z?openpo$/.test(endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase())) return withOpenPoDates(raw, range, now);
  if (/zme2n|^me2n|^purchaseorders?$|zpolist|polist/.test(endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase())) return withOpenPoDates(raw, range, now);
  if (isSitEndpoint(endpointName)) return withSitDates(raw, range, now, scheduled);
  if (endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase().includes("salesregister")) return withSalesRegisterMode(raw, scheduled, range, now);
  if (/^zcashflown?$/.test(endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase())) return raw ?? void 0;
  if (endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase().includes("usermanagementdropdown")) return raw ?? void 0;
  if (isVendorAgeingEndpoint(endpointName)) return withVendorAgeingPayload(raw, now, scheduled);
  if (isZfbl1nEndpoint(endpointName)) return withZfbl1nPayload(raw, now, scheduled);
  if (/dailyproduction|^zdpr$/.test(endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase())) return withDprDates(raw, range, now);
  if (endpointName.replace(/[^a-z0-9]/gi, "").toLowerCase().includes("orderbook")) return withOrderBookDates(raw, range, now);
  return isOpenSalesOrdersEndpoint(endpointName) ? withOpenSalesOrdersDate(raw, now, scheduled) : withPostingDates(raw, range);
}
function keyValueObject(raw) {
  return Array.isArray(raw) ? Object.fromEntries(
    raw.filter((r) => r && typeof r === "object" && String(r.key ?? "").trim()).map((r) => [String(r.key), String(r.value ?? "")])
  ) : {};
}
function formatBytes(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
var IS_STATIC_BUILD = define_import_meta_env_default["VITE_STATIC_BUILD"] === "1";
export {
  extractEmbeddedBody,
  formatBytes,
  isCurrentStockEndpoint,
  isUserDropdownEndpoint,
  isVendorAgeingEndpoint,
  isZfbl1nEndpoint,
  keyValueObject,
  mapCurrentStockPayload,
  mapUserDropdownPayload,
  mapVendorAgeingPayload,
  mapZfbl1nPayload,
  salvageTruncatedArray,
  withEndpointDates,
  withPostingDates,
  withVendorAgeingPayload,
  withZfbl1nPayload
};
