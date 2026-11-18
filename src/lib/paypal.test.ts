import { describe, expect, it } from "vitest";
import { buildPayPalMeUrl, parsePayPalMe } from "./paypal";

describe("paypal", () => {
  it("parses handles and urls", () => {
    expect(parsePayPalMe("@mario")).toBe("mario");
    expect(parsePayPalMe("https://www.paypal.me/Mario99/25")).toBe("Mario99");
    expect(parsePayPalMe("not valid!")).toBeNull();
    expect(parsePayPalMe("")).toBeNull();
  });

  it("builds url with 2 decimals", () => {
    expect(buildPayPalMeUrl("mario", 1250)).toBe("https://paypal.me/mario/12.50EUR");
    expect(buildPayPalMeUrl("mario", 5)).toBe("https://paypal.me/mario/0.05EUR");
  });

  it("rejects bad input", () => {
    expect(() => buildPayPalMeUrl("a b", 100)).toThrow();
    expect(() => buildPayPalMeUrl("mario", 0)).toThrow();
    expect(() => buildPayPalMeUrl("mario", 1.5)).toThrow();
  });
});
