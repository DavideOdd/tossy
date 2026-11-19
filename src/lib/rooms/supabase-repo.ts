import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Payment } from "@/lib/settlement";
import { normalizeCode } from "./code";
import type { Member, Preview, Profile, RoomRepo, RoomStatus, Snapshot } from "./types";

type MemberRow = { id: string; user_id: string; nickname: string; avatar: Member["avatar"]; paypal_me: string | null; is_owner: boolean };
type PaymentRow = { id: string; from_member: string; to_member: string; cents: number; approved_at: string | null; received_at: string | null };
type TransferRow = { id: string; from_member: string; to_member: string; cents: number; created_at: string };

/**
 * Real backend (Supabase: anonymous auth + RPC + Realtime). RLS lets members read their room;
 * every write is an RPC defined in supabase/migrations. Reads are re-fetched on any change event.
 */
export class SupabaseRepo implements RoomRepo {
  readonly kind = "supabase" as const;
  private sb: SupabaseClient;
  private ready: Promise<string>;
  private roomIds = new Map<string, string>();
  private pokes = new Map<string, Set<() => void>>();

  private poke(code: string) {
    this.pokes.get(normalizeCode(code))?.forEach((f) => f());
  }

  constructor(url: string, anonKey: string) {
    this.sb = createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
    this.ready = this.ensureUser();
  }

  private async ensureUser(): Promise<string> {
    const { data } = await this.sb.auth.getSession();
    if (data.session) return data.session.user.id;
    const { data: anon, error } = await this.sb.auth.signInAnonymously();
    if (error || !anon.user) throw error ?? new Error("anonymous sign-in failed");
    return anon.user.id;
  }

  private async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    await this.ready;
    const { data, error } = await this.sb.rpc(fn, args);
    if (error) throw new Error(error.message);
    return data as T;
  }

  async createRoom(name: string, me: Profile): Promise<string> {
    const rows = await this.rpc<{ code: string }[]>("create_room", { p_name: name, p_nickname: me.nickname, p_avatar: me.avatar });
    return rows[0].code;
  }

  async joinRoom(code: string, me: Profile): Promise<void> {
    await this.rpc("join_room", { p_code: normalizeCode(code), p_nickname: me.nickname, p_avatar: me.avatar });
    this.poke(code);
  }

  async preview(code: string): Promise<Preview | null> {
    const rows = await this.rpc<{ name: string; status: RoomStatus; member_count: number }[]>("room_preview", { p_code: normalizeCode(code) });
    return rows[0] ? { name: rows[0].name, status: rows[0].status, memberCount: rows[0].member_count } : null;
  }

  private async fetchSnapshot(code: string): Promise<Snapshot | null> {
    const uid = await this.ready;
    const { data: room } = await this.sb.from("rooms").select("id,name,status").eq("code", code).maybeSingle();
    if (!room) {
      // Not a member yet (RLS hides the room): show the join gate if the invite code exists.
      const pv = await this.preview(code);
      return pv ? { code, name: pv.name, status: pv.status, members: [], transfers: [], payments: [], meId: null } : null;
    }
    this.roomIds.set(code, room.id);
    const [m, t, pay] = await Promise.all([
      this.sb.from("members").select("id,user_id,nickname,avatar,paypal_me,is_owner").eq("room_id", room.id).order("seat").order("joined_at"),
      this.sb.from("transfers").select("id,from_member,to_member,cents,created_at").eq("room_id", room.id).order("created_at"),
      this.sb.from("settlement_payments").select("id,from_member,to_member,cents,approved_at,received_at").eq("room_id", room.id).order("cents", { ascending: false }).order("id"),
    ]);
    const members = (m.data ?? []) as MemberRow[];
    return {
      code,
      name: room.name,
      status: room.status as RoomStatus,
      members: members.map((x) => ({ id: x.id, nickname: x.nickname, avatar: x.avatar, paypalMe: x.paypal_me, isOwner: x.is_owner })),
      transfers: ((t.data ?? []) as TransferRow[]).map((x) => ({ id: x.id, from: x.from_member, to: x.to_member, cents: x.cents, at: Date.parse(x.created_at) })),
      payments: ((pay.data ?? []) as PaymentRow[]).map((x) => ({ id: x.id, from: x.from_member, to: x.to_member, cents: x.cents, approved: !!x.approved_at, received: !!x.received_at })),
      meId: members.find((x) => x.user_id === uid)?.id ?? null,
    };
  }

  subscribe(code: string, cb: (s: Snapshot | null) => void): () => void {
    const c = normalizeCode(code);
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let channel: ReturnType<SupabaseClient["channel"]> | undefined;
    let refresh: () => void = () => {};
    const ensureChannel = (snap: Snapshot | null) => {
      const id = this.roomIds.get(c);
      if (channel || !id || !snap?.meId) return;
      channel = this.sb
        .channel(`room:${c}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${id}` }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "members", filter: `room_id=eq.${id}` }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "transfers", filter: `room_id=eq.${id}` }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "settlement_payments", filter: `room_id=eq.${id}` }, refresh)
        .subscribe();
    };
    const run = async () => {
      const snap = await this.fetchSnapshot(c).catch(() => null);
      if (!alive) return;
      ensureChannel(snap);
      cb(snap);
    };
    refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(run, 30);
    };
    if (!this.pokes.has(c)) this.pokes.set(c, new Set());
    this.pokes.get(c)!.add(refresh);
    void run();
    return () => {
      alive = false;
      clearTimeout(timer);
      this.pokes.get(c)?.delete(refresh);
      if (channel) void this.sb.removeChannel(channel);
    };
  }

  private roomId(code: string): string {
    const id = this.roomIds.get(normalizeCode(code));
    if (!id) throw new Error("room not loaded");
    return id;
  }
  async startGame(code: string) {
    await this.rpc("start_game", { p_room: this.roomId(code) });
  }
  async closeRoom(code: string, payments: Payment[]) {
    await this.rpc("close_room", { p_room: this.roomId(code), p_payments: payments });
  }
  async setSeats(code: string, order: string[]) {
    await this.rpc("set_seats", { p_room: this.roomId(code), p_order: order });
  }
  async approvePayment(_code: string, id: string) {
    await this.rpc("approve_payment", { p_payment: id });
  }
  async confirmReceived(_code: string, id: string) {
    await this.rpc("confirm_received", { p_payment: id });
  }
  async transfer(code: string, to: string, cents: number, txId: string) {
    await this.rpc("transfer_coins", { p_room: this.roomId(code), p_to: to, p_cents: cents, p_tx: txId });
  }
  async setPaypal(code: string, handle: string) {
    await this.rpc("set_paypal_me", { p_room: this.roomId(code), p_handle: handle });
  }
}
