import { describe, expect, it } from "vitest";
import { DENOMS, denomOf, fmtCoin, fmtMoney, fmtSigned } from "./money";

describe("money", () => {
  it("formats cents as euro", () => {
    expect(fmtMoney(5)).toBe("€0,05");
    expect(fmtMoney(1250)).toBe("€12,50");
    expect(fmtMoney(-70)).toBe("−€0,70");
    expect(fmtMoney(0)).toBe("€0,00");
    expect(fmtSigned(120)).toBe("+€1,20");
  });

  it("labels coins", () => {
    expect(fmtCoin(50)).toBe("50c");
    expect(fmtCoin(100)).toBe("€1");
    expect(fmtCoin(200)).toBe("€2");
  });

  it("has the 8 real euro coins, unique and ascending", () => {
    expect(DENOMS.map((d) => d.cents)).toEqual([1, 2, 5, 10, 20, 50, 100, 200]);
    expect(() => denomOf(3)).toThrow();
  });
});
