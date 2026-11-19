/** All money is integer euro cents. A "coin" is a real euro coin denomination. */
export type CoinKind = "copper" | "nordic" | "bi1" | "bi2";
export type Denom = { cents: number; label: string; unit: "CENT" | "EURO"; mm: number; kind: CoinKind };

/** Real euro coin set with real diameters (mm). */
export const DENOMS: Denom[] = [
  { cents: 1, label: "1", unit: "CENT", mm: 16.25, kind: "copper" },
  { cents: 2, label: "2", unit: "CENT", mm: 18.75, kind: "copper" },
  { cents: 5, label: "5", unit: "CENT", mm: 21.25, kind: "copper" },
  { cents: 10, label: "10", unit: "CENT", mm: 19.75, kind: "nordic" },
  { cents: 20, label: "20", unit: "CENT", mm: 22.25, kind: "nordic" },
  { cents: 50, label: "50", unit: "CENT", mm: 24.25, kind: "nordic" },
  { cents: 100, label: "1", unit: "EURO", mm: 23.25, kind: "bi1" },
  { cents: 200, label: "2", unit: "EURO", mm: 25.75, kind: "bi2" },
];

export const MAX_COIN_MM = 25.75;
export const MAX_TRANSFER_CENTS = 50_000;

export const denomOf = (cents: number): Denom => {
  const d = DENOMS.find((x) => x.cents === cents);
  if (!d) throw new Error(`Not a euro coin: ${cents}`);
  return d;
};

/** €12,50 · −€0,05 */
export function fmtMoney(cents: number): string {
  const a = Math.abs(cents);
  return `${cents < 0 ? "−" : ""}€${Math.floor(a / 100)},${String(a % 100).padStart(2, "0")}`;
}

export const fmtSigned = (cents: number) => (cents > 0 ? "+" : "") + fmtMoney(cents);

/** Short coin label: 50c · €2 */
export const fmtCoin = (cents: number) => (cents >= 100 ? `€${cents / 100}` : `${cents}c`);
