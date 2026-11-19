"use client";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/avatar/Avatar";
import { Sheet } from "@/components/ui/Sheet";
import { fmtMoney } from "@/lib/money";
import { buildPayPalMeUrl, parsePayPalMe } from "@/lib/paypal";
import type { SettlePayment } from "@/lib/rooms/types";
import { settle } from "@/lib/settlement";
import { jingle } from "@/lib/sound";
import type { Player } from "./players";

const btn = "min-h-11 rounded-full px-4 text-sm font-bold ring-1 ring-white/10 transition active:scale-95";

function PayPalSetup({ onSave }: { onSave: (h: string) => void | Promise<void> }) {
  const [v, setV] = useState("");
  const [bad, setBad] = useState(false);
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.04] p-3">
      <p className="mb-2 text-sm">Devi ricevere dei soldi: aggiungi il tuo PayPal.Me così chi paga può aprire il link.</p>
      <div className="flex gap-2">
        <input value={v} onChange={(e) => { setV(e.target.value); setBad(false); }} placeholder="paypal.me/iltuonome" autoCapitalize="none" className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[.05] px-3 outline-none focus:border-gold-300" />
        <button className={`${btn} bg-felt-700`} onClick={() => { const h = parsePayPalMe(v); if (!h) return setBad(true); void onSave(h); }}>Salva</button>
      </div>
      {bad && <p className="mt-1 text-xs text-[#ff9a94]">Non sembra un PayPal.Me valido</p>}
    </div>
  );
}

export function SettleSheet({
  open, onClose, balances, players, meId, status, canClose, payments, onConfirmClose, onApprove, onReceived, onSetPaypal,
}: {
  open: boolean;
  onClose: () => void;
  balances: Record<string, number>;
  players: Player[];
  meId: string;
  status: "lobby" | "playing" | "closing" | "completed";
  /** Owner during play: confirm button that closes the room. */
  canClose: boolean;
  /** Published payments (after closing). */
  payments: SettlePayment[];
  onConfirmClose: () => void | Promise<void>;
  onApprove: (paymentId: string) => void | Promise<void>;
  onReceived: (paymentId: string) => void | Promise<void>;
  onSetPaypal: (handle: string) => void | Promise<void>;
}) {
  const byId = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);
  const closed = status === "closing" || status === "completed";
  const list = useMemo<SettlePayment[]>(
    () => (closed ? payments : open ? settle(balances).map((p, i) => ({ ...p, id: `preview-${i}`, approved: false, received: false })) : []),
    [closed, payments, open, balances],
  );
  const needsPaypal = closed && !byId[meId]?.paypalMe && list.some((p) => p.to === meId);

  return (
    <Sheet open={open} onClose={onClose} title={closed ? "Pagamenti" : "Chiudere la partita?"}>
      {list.length === 0 ? (
        <p className="py-6 text-center text-cream-50/80">Tutti pari. Buon Natale! 🎄</p>
      ) : (
        <ul className="space-y-3">
          {list.map((p) => {
            const to = byId[p.to];
            const handle = to.paypalMe;
            let url: string | null = null;
            try { url = handle ? buildPayPalMeUrl(handle, p.cents) : null; } catch {}
            return (
              <li key={p.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-3">
                <div className="flex items-center gap-3">
                  <Avatar cfg={byId[p.from].cfg} size={44} />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate"><b>{p.from === meId ? "Tu" : byId[p.from].name}</b> {p.from === meId ? "paghi" : "paga"} <b>{p.to === meId ? "te" : to.name}</b></p>
                    <p className="font-display text-lg font-bold text-gold-300">{fmtMoney(p.cents)}</p>
                  </div>
                  {closed && <span className="text-xs text-cream-50/70">{p.received ? "Ricevuto ✓" : p.approved ? "Approvato" : "In attesa"}</span>}
                </div>
                {closed && p.from === meId && !p.approved && (
                  <button className={`${btn} mt-3 w-full bg-cream-50 text-felt-900`} onClick={() => { jingle(); void onApprove(p.id); }}>Approvo il pagamento</button>
                )}
                {closed && p.from === meId && p.approved && !p.received && (
                  url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className={`${btn} mt-3 grid w-full place-items-center bg-[#0070e0]`}>Apri PayPal.Me · {fmtMoney(p.cents)}</a>
                  ) : (
                    <p className="mt-3 text-sm text-cream-50/80">{to.name} non ha un PayPal.Me: pagate di persona.</p>
                  )
                )}
                {closed && p.to === meId && p.approved && !p.received && (
                  <button className={`${btn} mt-3 w-full bg-cream-50 text-felt-900`} onClick={() => { jingle(); void onReceived(p.id); }}>Ho ricevuto {fmtMoney(p.cents)}</button>
                )}
                {closed && p.to === meId && !p.approved && <p className="mt-2 text-xs text-cream-50/60">Aspetta che {byId[p.from].name} approvi.</p>}
              </li>
            );
          })}
        </ul>
      )}
      {status === "completed" && <p className="mt-5 text-center font-display text-xl font-bold text-gold-300">Tutto saldato. Buon Natale! 🎄</p>}
      {needsPaypal && <PayPalSetup onSave={onSetPaypal} />}
      {canClose && status === "playing" && (
        <button onClick={() => void onConfirmClose()} className="mt-5 min-h-12 w-full rounded-full bg-cream-50 text-felt-900 py-3 font-semibold ring-1 ring-white/10 active:scale-[.98]">
          Conferma e blocca i movimenti
        </button>
      )}
      <p className="mt-5 text-xs leading-relaxed text-cream-50/60">
        Nessun addebito parte in automatico: il link PayPal.Me compare solo dopo la tua approvazione e il pagamento lo confermi tu su PayPal. Chi riceve poi conferma.
      </p>
    </Sheet>
  );
}
