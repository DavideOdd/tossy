"use client";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/avatar/Avatar";
import { Sheet } from "@/components/ui/Sheet";
import { settle } from "@/lib/settlement";
import { jingle } from "@/lib/sound";
import { DEMO_PLAYERS, ME, fmtEuro } from "./players";

const byId = Object.fromEntries(DEMO_PLAYERS.map((p) => [p.id, p]));

export function SettleSheet({
  open,
  onClose,
  balances,
  coinCents,
}: {
  open: boolean;
  onClose: () => void;
  balances: Record<string, number>;
  coinCents: number;
}) {
  const payments = useMemo(() => (open ? settle(balances) : []), [open, balances]);
  const [approved, setApproved] = useState<Record<number, boolean>>({});

  return (
    <Sheet open={open} onClose={onClose} title="Chiusura partita">
      {payments.length === 0 ? (
        <p className="py-6 text-center text-cream-50/80">Tutti pari. Buon Natale! 🎄</p>
      ) : (
        <ul className="space-y-3">
          {payments.map((p, i) => {
            const mine = p.from === ME;
            return (
              <li key={i} className="flex items-center gap-3 rounded-2xl border border-gold-500/30 bg-felt-900/60 p-3">
                <Avatar cfg={byId[p.from].cfg} size={44} />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate">
                    <b>{byId[p.from].name}</b> paga <b>{byId[p.to].name}</b>
                  </p>
                  <p className="font-display text-lg font-bold text-gold-300">{fmtEuro(p.coins * coinCents)}</p>
                </div>
                {mine ? (
                  <button
                    onClick={() => {
                      setApproved((a) => ({ ...a, [i]: true }));
                      jingle();
                    }}
                    disabled={approved[i]}
                    className="min-h-11 rounded-full bg-berry-600 px-4 text-sm font-bold shadow-lg ring-1 ring-gold-300/60 transition active:scale-95 disabled:bg-felt-700 disabled:text-gold-300"
                  >
                    {approved[i] ? "Approvato ✓" : "Approvo"}
                  </button>
                ) : (
                  <span className="text-xs text-cream-50/60">In attesa</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-5 text-xs leading-relaxed text-cream-50/60">
        Anteprima: nessun pagamento reale. Con la stanza reale, dopo l’approvazione si apre il link PayPal.Me precompilato
        e nessun addebito parte in automatico.
      </p>
    </Sheet>
  );
}
