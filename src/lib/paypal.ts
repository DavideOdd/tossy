const HANDLE = /^[A-Za-z0-9]{1,20}$/;

/** Accepts "handle", "@handle" or a full paypal.me URL; returns the clean handle or null. */
export function parsePayPalMe(input: string): string | null {
  const raw = input.trim().replace(/^(https?:\/\/)?(www\.)?paypal\.me\//i, "").replace(/^@/, "");
  const handle = raw.split(/[/?#]/)[0];
  return HANDLE.test(handle) ? handle : null;
}

/** PayPal.Me link with prefilled amount, e.g. https://paypal.me/mario/12.50EUR */
export function buildPayPalMeUrl(handle: string, cents: number, currency = "EUR"): string {
  const h = parsePayPalMe(handle);
  if (!h) throw new Error("Invalid PayPal.Me handle");
  if (!Number.isInteger(cents) || cents <= 0) throw new Error("Invalid amount");
  const amount = (cents / 100).toFixed(2);
  return `https://paypal.me/${h}/${amount}${currency}`;
}
