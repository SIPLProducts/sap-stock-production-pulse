import { describe, expect, it } from "vitest";
import { zfMonthLabel } from "@/components/zfbl1n-dashboard";
describe("zfMonthLabel", () => {
  it("shows month name and 2-digit year", () => { expect(zfMonthLabel("2019-02")).toBe("Feb-19"); expect(zfMonthLabel("2018-06")).toBe("Jun-18"); });
});
