import type { AvatarCfg } from "@/components/avatar/Avatar";

export type RoomStatus = "lobby" | "playing" | "closing" | "completed";

export type Member = { id: string; nickname: string; avatar: AvatarCfg; paypalMe: string | null; isOwner: boolean };
export type Transfer = { id: string; from: string; to: string; cents: number; at: number };
export type Profile = { nickname: string; avatar: AvatarCfg };

export type Snapshot = {
  code: string;
  name: string;
  status: RoomStatus;
  members: Member[];
  transfers: Transfer[];
  /** Member id of the current user in this room (null if not joined). */
  meId: string | null;
};

export type Preview = { name: string; status: RoomStatus; memberCount: number };

/** One interface, two backends: LocalRepo (same browser, demo) and SupabaseRepo (real realtime). */
export interface RoomRepo {
  readonly kind: "local" | "supabase";
  createRoom(name: string, me: Profile): Promise<string>;
  joinRoom(code: string, me: Profile): Promise<void>;
  preview(code: string): Promise<Preview | null>;
  /** Calls cb now and on every change; null = room not found. Returns unsubscribe. */
  subscribe(code: string, cb: (s: Snapshot | null) => void): () => void;
  startGame(code: string): Promise<void>;
  transfer(code: string, toMemberId: string, cents: number, txId: string): Promise<void>;
  closeRoom(code: string): Promise<void>;
  setPaypal(code: string, handle: string): Promise<void>;
}
