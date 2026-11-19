import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeCode } from "./code";
import type { Member, Preview, Profile, RoomRepo, RoomStatus, Snapshot } from "./types";

type MemberRow = { id: string; user_id: string; nickname: string; avatar: Member["avatar"]; paypal_me: string | null; is_owner: boolean };
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
  }

  async preview(code: string): Promise<Preview | null> {
    const rows = await this.rpc<{ name: string; status: RoomStatus; member_count: number }[]>("room_preview", { p_code: normalizeCode(code) });
    return rows[0] ? { name: rows[0].name, status: rows[0].status, memberCount: rows[0].member_count } : null;
  }

  private async fetchSnapshot(code: string): Promise<Snapshot | null> {
    const uid = await this.ready;
    const { data: room } = await this.sb.from("rooms").select("id,name,status").eq("code", code).maybeSingle();
    if (!room) return null;
    this.roomIds.set(code, room.id);
    const [m, t] = await Promise.all([
      this.sb.from("members").select("id,user_id,nickname,avatar,paypal_me,is_owner").eq("room_id", room.id).order("joined_at"),
      this.sb.from("transfers").select("id,from_member,to_member,cents,created_at").eq("room_id", room.id).order("created_at"),
    ]);
    const members = (m.data ?? []) as MemberRow[];
    return {
      code,
      name: room.name,
      status: room.status as RoomStatus,
      members: members.map((x) => ({ id: x.id, nickname: x.nickname, avatar: x.avatar, paypalMe: x.paypal_me, isOwner: x.is_owner })),
      transfers: ((t.data ?? []) as TransferRow[]).map((x) => ({ id: x.id, from: x.from_member, to: x.to_member, cents: x.cents, at: Date.parse(x.created_at) })),
      meId: members.find((x) => x.user_id === uid)?.id ?? null,
    };
  }

  subscribe(code: string, cb: (s: Snapshot | null) => void): () => void {
    const c = normalizeCode(code);
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let channel: ReturnType<SupabaseClient["channel"]> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => alive && cb(await this.fetchSnapshot(c).catch(() => null)), 30);
    };
    (async () => {
      const first = await this.fetchSnapshot(c).catch(() => null);
      if (!alive) return;
      cb(first);
      const id = this.roomIds.get(c);
      if (!id) return;
      channel = this.sb
        .channel(`room:${c}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${id}` }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "members", filter: `room_id=eq.${id}` }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "transfers", filter: `room_id=eq.${id}` }, refresh)
        .subscribe();
    })();
    return () => {
      alive = false;
      clearTimeout(timer);
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
  async closeRoom(code: string) {
    await this.rpc("close_room", { p_room: this.roomId(code) });
  }
  async transfer(code: string, to: string, cents: number, txId: string) {
    await this.rpc("transfer_coins", { p_room: this.roomId(code), p_to: to, p_cents: cents, p_tx: txId });
  }
  async setPaypal(code: string, handle: string) {
    await this.rpc("set_paypal_me", { p_room: this.roomId(code), p_handle: handle });
  }
}
