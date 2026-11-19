import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { balancesFromLedger, settle } from "./settlement";

describe("settle", () => {
  it("returns nothing when everyone is even", () => {
    expect(settle({ a: 0, b: 0 })).toEqual([]);
  });

  it("settles a simple case", () => {
    expect(settle({ a: 5, b: -5 })).toEqual([{ from: "b", to: "a", cents: 5 }]);
  });

  it("rejects non-zero-sum input", () => {
    expect(() => settle({ a: 1, b: 0 })).toThrow();
  });

  it("properties: zeroes everyone, <= n-1 payments, no self payments, order independent", () => {
    const ledger = fc.array(
      fc.record({
        from: fc.constantFrom("a", "b", "c", "d", "e", "f"),
        to: fc.constantFrom("a", "b", "c", "d", "e", "f"),
        cents: fc.integer({ min: 1, max: 50 }),
      }),
      { maxLength: 60 },
    );
    fc.assert(
      fc.property(ledger, (raw) => {
        const members = ["a", "b", "c", "d", "e", "f"];
        const l = raw.filter((t) => t.from !== t.to);
        const bal = balancesFromLedger(members, l);
        const pays = settle(bal);
        const after = { ...bal };
        for (const p of pays) {
          expect(p.from).not.toBe(p.to);
          expect(p.cents).toBeGreaterThan(0);
          after[p.from] += p.cents;
          after[p.to] -= p.cents;
        }
        expect(Object.values(after).every((v) => v === 0)).toBe(true);
        expect(pays.length).toBeLessThanOrEqual(members.length - 1);
        const reversed = Object.fromEntries(Object.entries(bal).reverse());
        expect(settle(reversed)).toEqual(pays);
      }),
    );
  });
});
