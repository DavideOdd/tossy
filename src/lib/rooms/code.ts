/** No 0/O/1/I/L: easy to read aloud over WhatsApp. */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateCode(rand: () => number = Math.random): string {
  let c = "";
  for (let i = 0; i < 6; i++) c += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  return c;
}

export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(new RegExp(`[^${CODE_ALPHABET}]`, "g"), "").slice(0, 6);
}

export const isValidCode = (c: string) => c.length === 6 && normalizeCode(c) === c;
