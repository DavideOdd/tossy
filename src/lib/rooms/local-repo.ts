import { DENOMS } from "@/lib/money";
import { parsePayPalMe } from "@/lib/paypal";
import { generateCode, normalizeCode } from "./code";
import type { Member, Preview, Profile, RoomRepo, RoomStatus, Snapshot, Transfer } from "./types";

export type KV = { getItem(k: string): string | null; setItem(k: string, v: string): void };
export type Bus = { post(code: string): void; onMessage(cb: (code: string) => void): void };

type StoredTransfer = Transfer & { tx: string };
type Stored = { code: string; name: string; status: RoomStatus; members: Member[]; transfers: StoredTransfer[] };

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
      meId: r.members.some((m) => m.id === me) ? me : null,
    };
  }
  private emit(code: string) {
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
    cb(this.snap(c));
    return () => void set.delete(cb);
  }

  async startGame(code: string) {
    const r = this.need(code);
    this.ownerOf(r);
    if (r.status !== "lobby") throw new Error("wrong state");
    if (r.members.length < 2) throw new Error("need at least 2 players");
    r.status = "playing";
    this.save(r);
  }

  async closeRoom(code: string) {
    const r = this.need(code);
    this.ownerOf(r);
    if (r.status !== "playing") throw new Error("wrong state");
    r.status = "closing";
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
  return new LocalRepo(localStorage, sessionStorage, bus);
}
