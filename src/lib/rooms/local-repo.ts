import { DENOMS } from "@/lib/money";
import { parsePayPalMe } from "@/lib/paypal";
import { generateCode, normalizeCode } from "./code";
import type { Payment } from "@/lib/settlement";
import type { Member, Preview, Profile, RoomRepo, RoomStatus, SettlePayment, Snapshot, Transfer } from "./types";

export type KV = { getItem(k: string): string | null; setItem(k: string, v: string): void };
export type Bus = { post(code: string): void; onMessage(cb: (code: string) => void): void };

type StoredTransfer = Transfer & { tx: string };
type Stored = { code: string; name: string; status: RoomStatus; members: Member[]; transfers: StoredTransfer[]; payments?: SettlePayment[] };

const MAX_MEMBERS = 20;
const uuid = () => globalThis.crypto.randomUUID();

/**
 * Backend for demo/offline use: room state in `store` (shared by tabs of one browser),
 * identity in `session` (per tab, so each tab can be a different player).
 * Mirrors the rules of the SQL RPCs in supabase/migrations.
 */
export class LocalRepo implements RoomRepo {
  readonly kind = "local" as const;
  private listeners = new Map<string, Set<(s: Snapshot | null) => void>>();
  private lastRaw = new Map<string, string | null>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private store: KV,
    private session: KV,
    private bus?: Bus,
  ) {
    bus?.onMessage((code) => this.emit(code));
  }

  private load(code: string): Stored | null {
    const raw = this.store.getItem(`tossy:room:${code}`);
    return raw ? (JSON.parse(raw) as Stored) : null;
  }
  private save(r: Stored) {
    this.store.setItem(`tossy:room:${r.code}`, JSON.stringify(r));
    this.emit(r.code);
    this.bus?.post(r.code);
  }
  private meId = (code: string) => this.session.getItem(`tossy:me:${code}`);

  private snap(code: string): Snapshot | null {
    const r = this.load(code);
    if (!r) return null;
    const me = this.meId(code);
    return {
      code: r.code,
      name: r.name,
      status: r.status,
      members: r.members,
      transfers: r.transfers.map((t) => ({ id: t.id, from: t.from, to: t.to, cents: t.cents, at: t.at })),
      payments: r.payments ?? [],
      meId: r.members.some((m) => m.id === me) ? me : null,
    };
  }
  private emit(code: string) {
    this.lastRaw.set(code, this.store.getItem(`tossy:room:${code}`));
    const s = this.snap(code);
    this.listeners.get(code)?.forEach((cb) => cb(s));
  }
  private need(code: string): Stored {
    const r = this.load(normalizeCode(code));
    if (!r) throw new Error("room not found");
    return r;
  }
  private ownerOf(r: Stored): Member {
    const me = r.members.find((m) => m.id === this.meId(r.code));
    if (!me?.isOwner) throw new Error("not allowed");
    return me;
  }

  async createRoom(name: string, me: Profile): Promise<string> {
    let code = generateCode();
    while (this.load(code)) code = generateCode();
    const id = uuid();
    this.session.setItem(`tossy:me:${code}`, id);
    this.save({
      code,
      name: name.trim().slice(0, 60) || "Partita",
      status: "lobby",
      members: [{ id, nickname: me.nickname.trim().slice(0, 24), avatar: me.avatar, paypalMe: null, isOwner: true }],
      transfers: [],
    });
    return code;
  }

  async joinRoom(code: string, me: Profile): Promise<void> {
    const r = this.need(code);
    const existing = r.members.find((m) => m.id === this.meId(r.code));
    if (existing) {
      existing.nickname = me.nickname.trim().slice(0, 24);
      existing.avatar = me.avatar;
    } else {
      if (r.status !== "lobby" && r.status !== "playing") throw new Error("room is closed");
      if (r.members.length >= MAX_MEMBERS) throw new Error("room is full");
      const id = uuid();
      this.session.setItem(`tossy:me:${r.code}`, id);
      r.members.push({ id, nickname: me.nickname.trim().slice(0, 24), avatar: me.avatar, paypalMe: null, isOwner: false });
    }
    this.save(r);
  }

  async preview(code: string): Promise<Preview | null> {
    const r = this.load(normalizeCode(code));
    return r ? { name: r.name, status: r.status, memberCount: r.members.length } : null;
  }

  subscribe(code: string, cb: (s: Snapshot | null) => void): () => void {
    const c = normalizeCode(code);
    const set = this.listeners.get(c) ?? new Set();
    set.add(cb);
    this.listeners.set(c, set);
    this.lastRaw.set(c, this.store.getItem(`tossy:room:${c}`));
    cb(this.snap(c));
    // Safety net next to BroadcastChannel/storage events: re-read shared storage once a second.
    this.timer ??= setInterval(() => this.poll(), 1000);
    return () => {
      set.delete(cb);
      if ([...this.listeners.values()].every((x) => x.size === 0) && this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    };
  }

  /** Emit for every watched room whose stored data changed since we last looked. */
  poll() {
    for (const [code, set] of this.listeners) {
      if (set.size && this.store.getItem(`tossy:room:${code}`) !== this.lastRaw.get(code)) this.emit(code);
    }
  }

  async startGame(code: string) {
    const r = this.need(code);
    this.ownerOf(r);
    if (r.status !== "lobby") throw new Error("wrong state");
    if (r.members.length < 2) throw new Error("need at least 2 players");
    r.status = "playing";
    this.save(r);
  }

  async closeRoom(code: string, payments: Payment[]) {
    const r = this.need(code);
    this.ownerOf(r);
    if (r.status !== "playing") throw new Error("wrong state");
    const net = Object.fromEntries(r.members.map((m) => [m.id, 0]));
    for (const t of r.transfers) {
      net[t.from] -= t.cents;
      net[t.to] += t.cents;
    }
    for (const p of payments) {
      if (!(p.from in net) || !(p.to in net) || p.cents <= 0) throw new Error("payment outside room");
      net[p.from] += p.cents;
      net[p.to] -= p.cents;
    }
    if (Object.values(net).some((v) => v !== 0)) throw new Error("payments do not settle the balances");
    r.payments = payments.map((p) => ({ ...p, id: uuid(), approved: false, received: false }));
    r.status = "closing";
    this.save(r);
  }

  async setSeats(code: string, order: string[]) {
    const r = this.need(code);
    this.ownerOf(r);
    if (r.status !== "lobby" && r.status !== "playing") throw new Error("wrong state");
    const ids = r.members.map((m) => m.id);
    if (order.length !== ids.length || new Set(order).size !== ids.length || !order.every((i) => ids.includes(i))) {
      throw new Error("order must list every member once");
    }
    r.members = order.map((i) => r.members.find((m) => m.id === i)!);
    this.save(r);
  }

  private payment(code: string, id: string, who: "from" | "to") {
    const r = this.need(code);
    const p = r.payments?.find((x) => x.id === id);
    if (!p || p[who] !== this.meId(r.code)) throw new Error("not allowed");
    return { r, p };
  }
  async approvePayment(code: string, id: string) {
    const { r, p } = this.payment(code, id, "from");
    if (r.status !== "closing") throw new Error("not allowed");
    p.approved = true;
    this.save(r);
  }
  async confirmReceived(code: string, id: string) {
    const { r, p } = this.payment(code, id, "to");
    if (!p.approved) throw new Error("not allowed or not approved");
    p.received = true;
    if (r.payments!.every((x) => x.received)) r.status = "completed";
    this.save(r);
  }

  async transfer(code: string, to: string, cents: number, txId: string) {
    const r = this.need(code);
    if (r.status !== "playing") throw new Error("room is not playing");
    const me = this.meId(r.code);
    if (!r.members.some((m) => m.id === me)) throw new Error("not a member");
    if (!r.members.some((m) => m.id === to)) throw new Error("recipient not in room");
    if (to === me) throw new Error("cannot pay yourself");
    if (!DENOMS.some((d) => d.cents === cents)) throw new Error("not a euro coin");
    if (r.transfers.some((t) => t.tx === txId)) return; // idempotent retry
    r.transfers.push({ id: uuid(), tx: txId, from: me!, to, cents, at: Date.now() });
    this.save(r);
  }

  async setPaypal(code: string, handle: string) {
    const r = this.need(code);
    const m = r.members.find((x) => x.id === this.meId(r.code));
    if (!m) throw new Error("not a member");
    const h = handle.trim() === "" ? null : parsePayPalMe(handle);
    if (handle.trim() !== "" && !h) throw new Error("invalid PayPal.Me handle");
    m.paypalMe = h;
    this.save(r);
  }
}

/** Browser wiring: localStorage (shared), sessionStorage (per tab), BroadcastChannel. */
export function browserLocalRepo(): LocalRepo {
  const ch = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("tossy") : null;
  const bus: Bus | undefined = ch
    ? { post: (c) => ch.postMessage(c), onMessage: (cb) => (ch.onmessage = (e) => cb(String(e.data))) }
    : undefined;
  const repo = new LocalRepo(localStorage, sessionStorage, bus);
  window.addEventListener("storage", (e) => {
    if (e.key?.startsWith("tossy:room:")) repo.poll();
  });
  return repo;
}
