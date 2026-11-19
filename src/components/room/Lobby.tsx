"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Avatar } from "@/components/avatar/Avatar";
import { SeatingSheet } from "@/components/room/SeatingSheet";
import { LocalNotice, Shell, primaryBtn } from "@/components/room/Shell";
import { getRepo, roomUrl } from "@/lib/rooms";
import { parsePayPalMe } from "@/lib/paypal";
import type { Snapshot } from "@/lib/rooms/types";

export function Lobby({ snap }: { snap: Snapshot }) {
  const repo = getRepo();
  const me = snap.members.find((m) => m.id === snap.meId)!;
  const [copied, setCopied] = useState(false);
  const [pp, setPp] = useState(me.paypalMe ?? "");
  const [ppState, setPpState] = useState<"idle" | "saved" | "bad">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [seating, setSeating] = useState(false);
  const link = roomUrl(snap.code);
  const msg = `Vieni a giocare a "${snap.name}" su Tossy! Codice ${snap.code} — ${link}`;
  const canStart = me.isOwner && snap.members.length >= 2;

  return (
    <Shell title={snap.name} back="/">
      <section className="mb-5 rounded-3xl border border-gold-500/40 bg-felt-900/60 p-5 text-center shadow-[inset_0_6px_20px_rgba(0,0,0,.4)]">
        <p className="text-xs uppercase tracking-[0.25em] text-cream-50/60">Codice stanza</p>
        <p className="gold-text font-display text-6xl font-extrabold tracking-[0.18em]">{snap.code}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className="grid min-h-12 place-items-center rounded-full bg-[#1f9d55] font-bold ring-1 ring-white/30 active:scale-95">
            Invita su WhatsApp
          </a>
          <button
            className="min-h-12 rounded-full bg-felt-700 font-bold ring-1 ring-gold-500/50 active:scale-95"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              } catch {}
            }}
          >
            {copied ? "Copiato ✓" : "Copia link"}
          </button>
        </div>
      </section>

      <section aria-label="Partecipanti" className="mb-5">
        <p className="mb-3 text-xs uppercase tracking-widest text-cream-50/60">Al tavolo · {snap.members.length}</p>
        {me.isOwner && snap.members.length > 1 && (
          <button onClick={() => setSeating(true)} className="mb-4 min-h-11 w-full rounded-full bg-felt-700 text-sm font-bold ring-1 ring-gold-500/50 active:scale-95">
            Disponi il tavolo (ordine dei posti)
          </button>
        )}
        <ul className="grid grid-cols-3 gap-4">
          <AnimatePresence>
            {snap.members.map((m) => (
              <motion.li key={m.id} layout initial={{ scale: 0.3, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 380, damping: 18 }} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <Avatar cfg={m.avatar} size={64} />
                  {m.isOwner && <span className="absolute -right-1 -top-1 text-lg" aria-label="Organizzatore">⭐</span>}
                </div>
                <span className="max-w-full truncate text-sm font-semibold">{snap.members.indexOf(m) + 1}. {m.id === snap.meId ? `${m.nickname} (tu)` : m.nickname}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </section>

      <section className="mb-5">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-cream-50/60">Il tuo PayPal.Me (facoltativo)</span>
          <div className="mt-1 flex gap-2">
            <input
              value={pp}
              onChange={(e) => {
                setPp(e.target.value);
                setPpState("idle");
              }}
              placeholder="paypal.me/iltuonome"
              autoCapitalize="none"
              className="h-12 min-w-0 flex-1 rounded-xl border border-gold-500/40 bg-felt-900/70 px-3 outline-none focus:border-gold-300"
            />
            <button
              className="min-h-12 rounded-xl bg-felt-700 px-4 font-bold ring-1 ring-gold-500/50 active:scale-95"
              onClick={async () => {
                const h = pp.trim() === "" ? "" : parsePayPalMe(pp);
                if (h === null) return setPpState("bad");
                await repo.setPaypal(snap.code, h);
                setPpState("saved");
              }}
            >
              Salva
            </button>
          </div>
        </label>
        <p className="mt-1 text-xs text-cream-50/50">
          {ppState === "saved" ? "Salvato ✓" : ppState === "bad" ? "Non sembra un PayPal.Me valido" : "Serve solo a fine partita per ricevere. Nessuna password, mai."}
        </p>
      </section>

      {repo.kind === "local" && <div className="mb-5"><LocalNotice /></div>}
      {err && <p className="mb-3 text-sm font-semibold text-[#ff9a94]">{err}</p>}
      <div className="mt-auto">
        {me.isOwner ? (
          <button
            disabled={!canStart}
            className={primaryBtn}
            onClick={async () => {
              try {
                await repo.startGame(snap.code);
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Errore");
              }
            }}
          >
            {canStart ? "Inizia la partita" : "Servono almeno 2 giocatori"}
          </button>
        ) : (
          <p className="text-center text-cream-50/70">In attesa che l’organizzatore inizi la partita…</p>
        )}
      </div>
      {me.isOwner && <SeatingSheet open={seating} onClose={() => setSeating(false)} members={snap.members} meId={snap.meId} onSave={(o) => repo.setSeats(snap.code, o)} />}
    </Shell>
  );
}
