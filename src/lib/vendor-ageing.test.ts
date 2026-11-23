import { describe, expect, it } from "vitest";
import { toVaRow, vaTotals } from "./vendor-ageing-data";
import { withVendorAgeingPayload } from "./vendor-ageing-map";

describe("vendor ageing", () => {
  it("shows SAP credits as positive outstanding and sums buckets", () => {
    const r = toVaRow({ lifnr: "1", wrbtr: -240000, d10: -40000, d90: -200000, msme_no: "UDYAM-1" });
    const t = vaTotals([r]);
    expect(t.total).toBe(240000);
    expect(t.buckets[0]).toBe(40000);
    expect(t.buckets[8]).toBe(200000);
    expect(t.msme).toBe(240000);
  });
  it("sends only one ageing basis and today's key date on scheduled runs", () => {
    const out = JSON.parse(withVendorAgeingPayload('{"S_KDATE":"20260101","R1":"X","R2":"X","R3":""}', new Date(2026, 10, 23), true)!);
    expect(out.S_KDATE).toBe("20261123");
    expect([out.R1, out.R2, out.R3]).toEqual(["X", "", ""]);
  });
});
