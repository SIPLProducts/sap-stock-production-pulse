import { describe, expect, it } from "vitest";
import { mapZfbl1nPayload, withZfbl1nPayload } from "./zfbl1n-map";
import { activeFilters, ZF_EMPTY } from "./zfbl1n-data";

describe("ZFBL1N", () => {
  it("maps items, drops duplicate lines and zero dates", () => {
    const it1 = { bukrs: "3106", gjahr: 2017, belnr: "2300002907", buzei: 2, dmshb: -16308.9, augdt: "0000-00-00", budat: "2018-02-28", konto: "0009000419" };
    const r = mapZfbl1nPayload({ items: [it1, it1, { bukrs: "1" }] }, "ZFBL1N");
    expect(r.rows).toHaveLength(1); expect(r.duplicates).toBe(1); expect(r.invalid).toBe(1);
    expect(r.rows[0]!["augdt"]).toBeNull(); expect(r.rows[0]!["dmshb"]).toBe(-16308.9); expect(r.rows[0]!["lifnr"]).toBe("0009000419");
  });
  it("scheduled open-item runs use today as key date", () => {
    const out = JSON.parse(withZfbl1nPayload('{"OPEN_ITEMS":"X","OPEN_AT_KEY_DATE":"20261121"}', new Date(2026, 10, 23), true)!);
    expect(out.OPEN_AT_KEY_DATE).toBe("20261123");
  });
  it("sends only filters that are set", () => {
    expect(activeFilters({ ...ZF_EMPTY, bukrs_from: "3101" })).toEqual({ bukrs_from: "3101" });
  });
});
