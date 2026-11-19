import { balancesFromLedger, settle } from "@/lib/settlement";
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

  it("only the owner reorders seats, every member exactly once", async () => {
    const ids = snap(anna).members.map((m) => m.id);
    const rev = [...ids].reverse();
    await expect(bruno.setSeats(code, rev)).rejects.toThrow(/not allowed/);
    await expect(anna.setSeats(code, ids.slice(1))).rejects.toThrow(/every member/);
    await anna.setSeats(code, rev);
    expect(snap(bruno).members.map((m) => m.id)).toEqual(rev);
  });

  it("closing freezes the room", async () => {
    await anna.startGame(code);
    const to = snap(anna).members[1].id;
    await anna.transfer(code, to, 50, tx());
    await expect(anna.closeRoom(code, [])).rejects.toThrow(/do not settle/);
    await anna.closeRoom(code, settle(balancesFromLedger(snap(anna).members.map((m) => m.id), snap(anna).transfers)));
    await expect(anna.transfer(code, to, 5, tx())).rejects.toThrow(/not playing/);
    const late = new LocalRepo(store, mem());
    await expect(late.joinRoom(code, prof("Zed"))).rejects.toThrow(/closed/);
  });

  it("settlement: payer approves, then receiver confirms, then completed", async () => {
    await anna.startGame(code);
    await anna.transfer(code, snap(anna).members[1].id, 50, tx());
    const sn = snap(anna);
    await anna.closeRoom(code, settle(balancesFromLedger(sn.members.map((m) => m.id), sn.transfers)));
    const [p] = snap(anna).payments;
    expect(p).toMatchObject({ cents: 50, approved: false });
    await expect(bruno.confirmReceived(code, p.id)).rejects.toThrow(/not approved|not allowed/);
    await expect(bruno.approvePayment(code, p.id)).rejects.toThrow(/not allowed/);
    await anna.approvePayment(code, p.id);
    await anna.confirmReceived(code, p.id).catch(() => {}); // payer is not the receiver
    expect(snap(anna).payments[0].received).toBe(false);
    await bruno.confirmReceived(code, p.id);
    expect(snap(anna).status).toBe("completed");
  });

  it("picks up changes from other tabs via poll() even without a bus", async () => {
    const counts: number[] = [];
    const off = anna.subscribe(code, (s) => counts.push(s?.members.length ?? -1));
    const carla = new LocalRepo(store, mem());
    await carla.joinRoom(code, prof("Carla")); // anna has no bus: not notified yet
    expect(counts.at(-1)).toBe(2);
    anna.poll();
    off();
    expect(counts.at(-1)).toBe(3);
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
