/** Browser-safe request defaults; only the key date is exposed as a form control. */
export function vendorAgeingToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(now).split("/").reverse().join("");
}

export function vendorAgeingRequest(raw: string | null | undefined, keyDate = vendorAgeingToday()): string {
  let saved: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(raw || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) saved = parsed as Record<string, unknown>;
  } catch { /* Supply the standard request when no valid template exists. */ }
  return JSON.stringify({
    VENDOR_FROM: [], VENDOR_TO: [], BUKRS_FROM: [], BUKRS_TO: [],
    BLART_FROM: [], BLART_TO: [], PRCTR_FROM: [], PRCTR_TO: [], HKONT_FROM: [], HKONT_TO: [],
    MSME: "", D1: "30", D2: "90", D3: "120", D4: "180", D6: "366", D7: "732", D8: "1097", D9: "1827",
    ...saved, S_KDATE: keyDate, R1: "X", R2: "", R3: "",
  }, null, 2);
}