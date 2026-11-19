"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/avatar/Avatar";
import { Coin } from "@/components/coin/Coin";
import { Sheet } from "@/components/ui/Sheet";
import { DENOMS, fmtCoin } from "@/lib/money";
import { balancesFromLedger } from "@/lib/settlement";
import { isMuted, setMuted, unlockAudio } from "@/lib/sound";
import { BalanceCounter } from "./BalanceCounter";
import { SettleSheet } from "./SettleSheet";
import { DEMO_PLAYERS, ME, seatPos } from "./players";
import { useCoinThrow } from "./useCoinThrow";

type Entry = { id: number; from: string; to: string; cents: number };
const others = DEMO_PLAYERS.filter((p) => p.id !== ME);
const names = Object.fromEntries(DEMO_PLAYERS.map((p) => [p.id, p.name]));

export function Table() {
  const [ledger, setLedger] = useState<Entry[]>([]);
  const [amount, setAmount] = useState(10);
  const [pops, setPops] = useState<{ id: number; to: string; n: number }[]>([]);
  const [sheet, setSheet] = useState<null | "history" | "settle">(null);
  const [mute, setMute] = useState(false);
  const seatRefs = useRef<Record<string, HTMLElement | null>>({});
  const trayRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  const balances = useMemo(() => balancesFromLedger(DEMO_PLAYERS.map((p) => p.id), ledger), [ledger]);

  const { x, y, scale, rotX, rotY, hoverId, flying, handlers } = useCoinThrow({
    seatRefs,
    trayRef,
    onLand: (to) => {
      const id = ++seq.current;
      setLedger((l) => [{ id, from: ME, to, cents: amount }, ...l]);
      setPops((p) => [...p, { id, to, n: amount }]);
      setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 900);
    },
  });

  return (
    <main className="relative mx-auto flex h-dvh max-w-md select-none flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
      <header className="flex items-start justify-between px-5 pt-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold-300/80">Stanza · NAT24X</p>
          <h1 className="font-display text-2xl font-bold leading-tight">Cena della Vigilia</h1>
        </div>
        <div className="flex gap-2">
          <button
            aria-label={mute ? "Attiva suoni" : "Silenzia"}
            onClick={() => {
              unlockAudio();
              setMuted(!isMuted());
              setMute(isMuted());
            }}
            className="grid h-11 w-11 place-items-center rounded-full bg-felt-900/70 ring-1 ring-gold-500/50"
          >
            {mute ? "🔇" : "🔔"}
          </button>
          <button
            onClick={() => setSheet("history")}
            className="min-h-11 rounded-full bg-felt-900/70 px-4 text-sm font-semibold ring-1 ring-gold-500/50"
          >
            Storico
          </button>
        </div>
      </header>

      <section className="px-5 pt-3 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-cream-50/60">Il tuo saldo</p>
        <BalanceCounter value={balances[ME]} className="text-6xl" />
      </section>

      <section className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-2 inset-y-4 rounded-[50%] border border-gold-500/25 bg-felt-900/30 shadow-[inset_0_10px_40px_rgba(0,0,0,.45)]" />
        {others.map((p, i) => {
          const pos = seatPos(i, others.length);
          const hot = hoverId === p.id;
          return (
            <div
              key={p.id}
              className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
            >
              <motion.div
                ref={(el) => {
                  seatRefs.current[p.id] = el;
                }}
                animate={{ scale: hot ? 1.22 : 1, y: hot ? -4 : 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className="relative rounded-full"
                style={{ boxShadow: hot ? "0 0 0 4px rgba(242,217,139,.9), 0 0 36px 8px rgba(242,217,139,.55)" : "none" }}
              >
                <Avatar cfg={p.cfg} size={64} />
                <AnimatePresence>
                  {pops
                    .filter((q) => q.to === p.id)
                    .map((q) => (
                      <motion.span
                        key={q.id}
                        className="pointer-events-none absolute inset-0 rounded-full border-4 border-gold-300"
                        initial={{ scale: 0.8, opacity: 0.9 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        transition={{ duration: 0.7 }}
                      />
                    ))}
                </AnimatePresence>
                <AnimatePresence>
                  {pops
                    .filter((q) => q.to === p.id)
                    .map((q) => (
                      <motion.span
                        key={`n${q.id}`}
                        className="font-display pointer-events-none absolute -top-2 left-1/2 text-2xl font-extrabold text-gold-300 drop-shadow"
                        initial={{ y: 0, x: "-50%", opacity: 1 }}
                        animate={{ y: -46, opacity: 0 }}
                        transition={{ duration: 0.85, ease: "easeOut" }}
                      >
                        +{fmtCoin(q.n)}
                      </motion.span>
                    ))}
                </AnimatePresence>
              </motion.div>
              <span className="mt-1 max-w-full truncate text-xs font-semibold">{p.name}</span>
              <BalanceCounter value={balances[p.id]} className="text-lg" />
            </div>
          );
        })}
      </section>

      <footer className="px-5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="-mx-2 mb-3 flex justify-center gap-1" role="radiogroup" aria-label="Scegli la moneta">
          {DENOMS.map((d) => (
            <button
              key={d.cents}
              role="radio"
              aria-checked={amount === d.cents}
              aria-label={fmtCoin(d.cents)}
              onClick={() => setAmount(d.cents)}
              className={`grid h-11 w-10 place-items-center rounded-xl transition ${
                amount === d.cents ? "bg-felt-900 ring-2 ring-gold-300" : "opacity-70 active:scale-95"
              }`}
            >
              <Coin cents={d.cents} size={36} />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="w-24 text-xs leading-snug text-cream-50/70">
            {ledger.length === 0 ? "Trascina la moneta su un amico" : "Lancia di nuovo!"}
          </p>
          <div
            ref={trayRef}
            className="relative grid h-28 w-28 place-items-center rounded-full border-2 border-dashed border-gold-500/50 bg-felt-900/70 shadow-[inset_0_6px_18px_rgba(0,0,0,.55)]"
          >
            <motion.div
              drag={!flying}
              dragMomentum={false}
              dragElastic={1}
              {...handlers}
              style={{ x, y, scale, touchAction: "none", filter: "drop-shadow(0 10px 7px rgba(0,0,0,.5))", zIndex: 30 }}
              className="cursor-grab active:cursor-grabbing"
              aria-label={`Moneta da ${fmtCoin(amount)}. Trascinala su un giocatore`}
              role="button"
            >
              <Coin cents={amount} size={84} rotateX={rotX} rotateY={rotY} />
            </motion.div>
          </div>
          <button
            onClick={() => setSheet("settle")}
            className="min-h-11 w-24 rounded-2xl bg-berry-600 px-2 text-sm font-bold shadow-lg ring-1 ring-gold-300/60 active:scale-95"
          >
            Chiudi partita
          </button>
        </div>
      </footer>

      <Sheet open={sheet === "history"} onClose={() => setSheet(null)} title="Storico">
        {ledger.length === 0 ? (
          <p className="text-cream-50/70">Ancora nessun movimento.</p>
        ) : (
          <ul className="space-y-2">
            {ledger.map((e) => (
              <li key={e.id} className="flex justify-between rounded-xl bg-felt-900/60 px-3 py-2 text-sm">
                <span>
                  {names[e.from]} → <b>{names[e.to]}</b>
                </span>
                <b className="text-gold-300">{fmtCoin(e.cents)}</b>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
      <SettleSheet open={sheet === "settle"} onClose={() => setSheet(null)} balances={balances} />
    </main>
  );
}
