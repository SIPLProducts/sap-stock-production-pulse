import { describe, expect, it } from "vitest";
import { rebucketByBasis, type VaRow } from "./vendor-ageing-data";
const row = { amount: 100, dueDate: "2026-11-01", postDate: "2026-01-01", keyDate: "2026-11-23", buckets: [100, 0, 0, 0, 0, 0, 0, 0, 0], days: 0 } as unknown as VaRow;
describe("rebucketByBasis", () => {
  it("due date 22 days -> 0-30", () => { const [r] = rebucketByBasis([row], "due", ""); expect(r?.days).toBe(22); expect(r?.buckets[0]).toBe(100); });
  it("posting date 326 days -> 181-365", () => { const [r] = rebucketByBasis([row], "post", ""); expect(r?.buckets[4]).toBe(100); });
  it("all keeps rows", () => { expect(rebucketByBasis([row], "all", "")[0]).toBe(row); });
});
