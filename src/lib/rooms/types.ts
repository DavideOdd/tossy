import type { AvatarCfg } from "@/components/avatar/Avatar";
import type { Payment } from "@/lib/settlement";

export type RoomStatus = "lobby" | "playing" | "closing" | "completed";

export type Member = { id: string; nickname: string; avatar: AvatarCfg; paypalMe: string | null; isOwner: boolean };
export type Transfer = { id: string; from: string; to: string; cents: number; at: number };
/** A closing payment: approved by the payer (unlocks PayPal.Me), then confirmed by the receiver. */
export type SettlePayment = Payment & { id: string; approved: boolean; received: boolean };
export type Profile = { nickname: string; avatar: AvatarCfg };

export type Snapshot = {
  code: string;
  name: string;
  status: RoomStatus;
  /** Ordered by seat, clockwise seen from above. */
  members: Member[];
  transfers: Transfer[];
  /** Empty until the owner closes the room. */
  payments: SettlePayment[];
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
  /** Owner only: freezes the ledger and publishes the payments that zero every balance. */
  closeRoom(code: string, payments: Payment[]): Promise<void>;
  /** Owner only: full clockwise order of member ids. */
  setSeats(code: string, order: string[]): Promise<void>;
  approvePayment(code: string, paymentId: string): Promise<void>;
  confirmReceived(code: string, paymentId: string): Promise<void>;
  setPaypal(code: string, handle: string): Promise<void>;
}
