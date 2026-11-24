import { describe, expect, it } from "vitest";
import { vendorAgeingRequest, vendorAgeingToday } from "./vendor-ageing-request";
import { VA_BASES, withVendorAgeingBasis, withVendorAgeingPayload } from "./vendor-ageing-map";

describe("Vendor Ageing date-only request", () => {
  it("defaults the date to the current IST day", () => {
    const now = new Date("2026-11-23T20:00:00Z");
    expect(vendorAgeingToday(now)).toBe("20261124");
    expect(JSON.parse(vendorAgeingRequest("{}", vendorAgeingToday(now)))["S_KDATE"]).toBe("20261124");
  });
  it("keeps all required bucket values and empty range arrays without extra inputs", () => {
    const body = JSON.parse(vendorAgeingRequest("{}", "20261123"));
    expect([body.D1, body.D2, body.D3, body.D4, body.D6, body.D7, body.D8, body.D9]).toEqual(["30", "90", "120", "180", "366", "732", "1097", "1827"]);
    for (const key of ["VENDOR", "BUKRS", "BLART", "PRCTR", "HKONT"]) {
      expect(body[`${key}_FROM`]).toEqual([]);
      expect(body[`${key}_TO`]).toEqual([]);
    }
    expect(body.MSME).toBe("");
  });
  for (const [key] of VA_BASES) {
    it(`retains the selected custom date for ${key}`, () => {
      const saved = vendorAgeingRequest("{}", "20261123");
      const result = withVendorAgeingBasis(withVendorAgeingPayload(saved, new Date("2026-11-24T05:00:00Z")), key);
      if (!result) throw new Error("Missing body");
      const body = JSON.parse(result);
      expect(body.S_KDATE).toBe("20261123");
      expect([body.R1, body.R2, body.R3]).toEqual(key === "R1" ? ["X", "", ""] : key === "R2" ? ["", "X", ""] : ["", "", "X"]);
    });
  }
});