export type Payment = { from: string; to: string; cents: number };

/**
 * Min-cash-flow greedy: matches the largest debtor with the largest creditor.
 * Guarantees at most n-1 payments. Deterministic (ties broken by id).
 * Input: net balance in cents per member (must sum to 0).
 */
export function settle(balances: Record<string, number>): Payment[] {
  const sum = Object.values(balances).reduce((a, b) => a + b, 0);
  if (sum !== 0) throw new Error("Balances must sum to zero");

  const byAmountThenId = (a: [string, number], b: [string, number]) =>
    b[1] - a[1] || a[0].localeCompare(b[0]);

  const creditors = Object.entries(balances).filter(([, v]) => v > 0).sort(byAmountThenId);
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < 0)
    .map(([k, v]): [string, number] => [k, -v])
    .sort(byAmountThenId);

  const payments: Payment[] = [];
  while (creditors.length && debtors.length) {
    const c = creditors[0];
    const d = debtors[0];
    const cents = Math.min(c[1], d[1]);
    payments.push({ from: d[0], to: c[0], cents });
    c[1] -= cents;
    d[1] -= cents;
    if (c[1] === 0) creditors.shift();
    if (d[1] === 0) debtors.shift();
    creditors.sort(byAmountThenId);
    debtors.sort(byAmountThenId);
  }
  return payments;
}

/** Net balances (cents) from a ledger of transfers. */
export function balancesFromLedger(
  members: string[],
  ledger: { from: string; to: string; cents: number }[],
): Record<string, number> {
  const b: Record<string, number> = Object.fromEntries(members.map((m) => [m, 0]));
  for (const t of ledger) {
    b[t.from] -= t.cents;
    b[t.to] += t.cents;
  }
  return b;
}
