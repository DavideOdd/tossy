"use client";
import { useState } from "react";
import { Avatar } from "@/components/avatar/Avatar";
import { Sheet } from "@/components/ui/Sheet";
import type { Member } from "@/lib/rooms/types";

/** Owner-only: set the clockwise seat order so the virtual table matches the real one. */
export function SeatingSheet({
  open,
  onClose,
  members,
  meId,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  members: Member[];
  meId: string | null;
  onSave: (order: string[]) => Promise<void>;
}) {
  const [err, setErr] = useState<string | null>(null);
  const n = members.length;

  const move = async (i: number, d: -1 | 1) => {
    const order = members.map((m) => m.id);
    const j = (i + d + n) % n;
    [order[i], order[j]] = [order[j], order[i]];
    try {
      setErr(null);
      await onSave(order);
    } catch {
      setErr("Non sono riuscito a salvare l’ordine.");
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Disponi il tavolo">
      <p className="mb-4 text-sm leading-relaxed text-cream-50/80">
        Metti i giocatori nello stesso ordine in cui siedono davvero, in <b>senso orario</b> visto dall’alto. Ognuno vedrà sé stesso in basso e gli altri nell’ordine giusto.
      </p>
      <div className="relative mx-auto mb-5 aspect-square w-60">
        <div className="absolute inset-3 rounded-[50%] border border-white/10 bg-white/[.04] " />
        {members.map((m, i) => {
          const a = ((90 + (i * 360) / n) * Math.PI) / 180;
          return (
            <div key={m.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${50 + 40 * Math.cos(a)}%`, top: `${50 + 40 * Math.sin(a)}%`, transition: "left .3s, top .3s" }}>
              <Avatar cfg={m.avatar} size={44} />
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-gold-300 text-[11px] font-semibold text-felt-900">{i + 1}</span>
            </div>
          );
        })}
        <p className="absolute inset-x-0 bottom-[-6px] text-center text-[10px] text-cream-50/50">↻ senso orario</p>
      </div>
      <ol className="space-y-2">
        {members.map((m, i) => (
          <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-white/[.04] p-2 pr-3">
            <span className="w-6 text-center font-display text-lg font-bold text-gold-300">{i + 1}</span>
            <Avatar cfg={m.avatar} size={40} />
            <span className="min-w-0 flex-1 truncate font-semibold">{m.id === meId ? `${m.nickname} (tu)` : m.nickname}</span>
            <button aria-label={`Sposta ${m.nickname} su`} disabled={n < 2} onClick={() => move(i, -1)} className="h-11 w-11 rounded-full bg-felt-700 text-lg ring-1 ring-white/10 active:scale-90 disabled:opacity-40">▲</button>
            <button aria-label={`Sposta ${m.nickname} giù`} disabled={n < 2} onClick={() => move(i, 1)} className="h-11 w-11 rounded-full bg-felt-700 text-lg ring-1 ring-white/10 active:scale-90 disabled:opacity-40">▼</button>
          </li>
        ))}
      </ol>
      {err && <p className="mt-3 text-sm font-semibold text-[#ff9a94]">{err}</p>}
      <p className="mt-4 text-xs text-cream-50/60">Le modifiche sono subito visibili a tutti.</p>
    </Sheet>
  );
}
