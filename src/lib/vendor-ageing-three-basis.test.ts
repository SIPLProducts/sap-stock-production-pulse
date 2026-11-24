import { describe, expect, it } from "vitest";
import { VA_BASES, withVendorAgeingBasis, withVendorAgeingPayload, mapVendorAgeingPayload } from "./vendor-ageing-map";
import { filterVendorAgeingBasis, toVaRow, vaTotals } from "./vendor-ageing-data";

describe("Vendor Ageing three basis requests", () => {
  for (const [key, label] of VA_BASES) {
    it(`${key} sends only its own X and preserves the other saved fields`, () => {
      const raw = withVendorAgeingPayload('{"S_KDATE":"20261123","R1":"X","R2":"X","R3":"X","D1":"30","VENDOR_FROM":["100"]}');
      const body = withVendorAgeingBasis(raw, key);
      if (!body) throw new Error("Missing request body");
      const actual = JSON.parse(body) as Record<string, unknown>;
      expect([actual["R1"], actual["R2"], actual["R3"]]).toEqual(key === "R1" ? ["X", "", ""] : key === "R2" ? ["", "X", ""] : ["", "", "X"]);
      expect(actual["S_KDATE"]).toBe("20261123");
      expect(actual["D1"]).toBe("30");
      expect(actual["VENDOR_FROM"]).toEqual(["100"]);
    });
    it(`${label} is persisted without overwriting SAP profit center description`, () => {
      const mapped = mapVendorAgeingPayload({ DATA: [{ LIFNR: "100", WRBTR: "-100", PRCTR_TEXT: "CORP" }] }, "Vendor_Ageing", new Date("2026-11-23T18:00:00Z"), label);
      expect(mapped.rows[0]?.["pc_text"]).toBe(label);
      expect(mapped.rows[0]?.["prctr_text"]).toBe("CORP");
    });
  }
  it("requests Due Date then Posting Date then GRN Date", () => {
    expect(VA_BASES).toEqual([["R1", "Due Date"], ["R2", "Posting Date"], ["R3", "GRN Date"]]);
  });
});

describe("stored basis totals", () => {
  const rows = [
    toVaRow({ lifnr: "100", wrbtr: -100, pc_text: "Due Date", days: 12, d10: -100 }),
    toVaRow({ lifnr: "100", wrbtr: -100, pc_text: "Posting Date", days: 45, d20: -100 }),
    toVaRow({ lifnr: "100", wrbtr: -100, pc_text: "GRN Date", days: 100, d30: -100 }),
  ];
  it("Due Date totals count only R1 rows", () => { expect(vaTotals(filterVendorAgeingBasis(rows, "due")).total).toBe(100); });
  it("Posting Date retains SAP days and buckets", () => { expect(filterVendorAgeingBasis(rows, "post")[0]?.days).toBe(45); expect(filterVendorAgeingBasis(rows, "post")[0]?.buckets[1]).toBe(100); });
  it("GRN Date works without a GRN date field", () => { expect(vaTotals(filterVendorAgeingBasis(rows, "grn")).total).toBe(100); });
  it("All explicitly includes all three response sets", () => { expect(vaTotals(filterVendorAgeingBasis(rows, "all")).total).toBe(300); });
  it("older untagged rows appear in All, not incorrectly assigned to a basis", () => {
    const old = [toVaRow({ lifnr: "100", wrbtr: -20 })];
    expect(filterVendorAgeingBasis(old, "due")).toHaveLength(0);
    expect(filterVendorAgeingBasis(old, "all")).toHaveLength(1);
  });
});
