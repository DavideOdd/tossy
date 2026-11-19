import { beforeEach, describe, expect, it } from "vitest";
import { LocalRepo, type KV } from "./local-repo";
import { generateCode, isValidCode, normalizeCode } from "./code";
import type { Snapshot } from "./types";

const mem = (): KV & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
};
const av = { skin: "#fff", bg: "#000", scarf: "#f00", hat: "santa" } as const;
const prof = (n: string) => ({ nickname: n, avatar: av });
const tx = () => crypto.randomUUID();

let store: ReturnType<typeof mem>;
let anna: LocalRepo, bruno: LocalRepo;
let code: string;

beforeEach(async () => {
  store = mem();
  anna = new LocalRepo(store, mem());
  bruno = new LocalRepo(store, mem()); // same room store, other tab
  code = await anna.createRoom("Vigilia", prof("Anna"));
  await bruno.joinRoom(code, prof("Bruno"));
});

const snap = (r: LocalRepo): Snapshot => {
  let s: Snapshot | null = null;
  r.subscribe(code, (x) => (s = x))();
  return s!;
};

describe("codes", () => {
  it("generates valid, normalizable codes", () => {
    expect(isValidCode(generateCode())).toBe(true);
    expect(normalizeCode(" ab-c0o1 d23 ")).toBe("ABCD23");
  });
});

describe("LocalRepo", () => {
  it("each tab sees itself as a different player", () => {
    const a = snap(anna);
    const b = snap(bruno);
    expect(a.members).toHaveLength(2);
    expect(a.meId).not.toBe(b.meId);
    expect(a.members.find((m) => m.id === a.meId)?.isOwner).toBe(true);
  });

  it("only the owner starts, and needs 2 players", async () => {
    await expect(bruno.startGame(code)).rejects.toThrow(/not allowed/);
    await anna.startGame(code);
    expect(snap(bruno).status).toBe("playing");
  });

  it("enforces the transfer rules", async () => {
    const to = snap(anna).members.find((m) => !m.isOwner)!.id;
    await expect(anna.transfer(code, to, 50, tx())).rejects.toThrow(/not playing/);
    await anna.startGame(code);
    await expect(anna.transfer(code, to, 3, tx())).rejects.toThrow(/euro coin/);
    await expect(anna.transfer(code, snap(anna).meId!, 5, tx())).rejects.toThrow(/yourself/);
    const id = tx();
    await anna.transfer(code, to, 50, id);
    await anna.transfer(code, to, 50, id); // retry is idempotent
    expect(snap(bruno).transfers).toHaveLength(1);
    expect(snap(bruno).transfers[0]).toMatchObject({ cents: 50, to });
  });

  it("closing freezes the room", async () => {
    await anna.startGame(code);
    await anna.closeRoom(code);
    const to = snap(anna).members[1].id;
    await expect(anna.transfer(code, to, 5, tx())).rejects.toThrow(/not playing/);
    const late = new LocalRepo(store, mem());
    await expect(late.joinRoom(code, prof("Zed"))).rejects.toThrow(/closed/);
  });

  it("notifies subscribers and validates PayPal.Me", async () => {
    const seen: number[] = [];
    const off = anna.subscribe(code, (s) => seen.push(s?.members.length ?? -1));
    await bruno.setPaypal(code, "@bruno99");
    off();
    expect(snap(anna).members.find((m) => m.paypalMe)?.paypalMe).toBe("bruno99");
    expect(seen.length).toBeGreaterThan(0);
    await expect(bruno.setPaypal(code, "no good!")).rejects.toThrow(/invalid/);
  });
});
