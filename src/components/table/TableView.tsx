"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/avatar/Avatar";
import { Coin } from "@/components/coin/Coin";
import { Sheet } from "@/components/ui/Sheet";
import { DENOMS, fmtCoin } from "@/lib/money";
import type { RoomStatus, SettlePayment } from "@/lib/rooms/types";
import { balancesFromLedger } from "@/lib/settlement";
import { isMuted, setMuted, unlockAudio } from "@/lib/sound";
import { BalanceCounter } from "./BalanceCounter";
import { SettleSheet } from "./SettleSheet";
import { seatPos, type Player } from "./players";
import { useCoinThrow } from "./useCoinThrow";

export type Entry = { id: string; from: string; to: string; cents: number };
type Pop = { id: string; to: string; n: number };
type Flight = { id: string; cents: number; x0: number; y0: number; x1: number; y1: number };
const center = (el: HTMLElement | null) => {
  const r = el?.getBoundingClientRect();
  return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
};

export function TableView({
  roomName,
  code,
  players,
  meId,
  ledger,
  status = "playing",
  canClose = false,
  payments = [],
  onThrow,
  onClose,
  onApprove,
  onReceived,
  onSetPaypal,
  onArrange,
}: {
  roomName: string;
  code: string;
  players: Player[];
  meId: string;
  ledger: Entry[]; // oldest first
  status?: RoomStatus;
  canClose?: boolean;
  onThrow: (toId: string, cents: number) => void | Promise<void>;
  payments?: SettlePayment[];
  onClose?: () => void | Promise<void>;
  onApprove?: (paymentId: string) => void | Promise<void>;
  onReceived?: (paymentId: string) => void | Promise<void>;
  onSetPaypal?: (handle: string) => void | Promise<void>;
  /** Owner only: opens the seat-order editor. */
  onArrange?: () => void;
}) {
  const [amount, setAmount] = useState(10);
  const [pops, setPops] = useState<Pop[]>([]);
  const reduce = useReducedMotion();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [sheet, setSheet] = useState<null | "history" | "settle">(null);
  const [dismissed, setDismissed] = useState(false);
  const [mute, setMute] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const seatRefs = useRef<Record<string, HTMLElement | null>>({});
  const trayRef = useRef<HTMLDivElement>(null);
  const seen = useRef<Set<string> | null>(null);

  const playing = status === "playing";
  const others = useMemo(() => players.filter((p) => p.id !== meId), [players, meId]);
  const names = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p.name])), [players]);
  const balances = useMemo(() => balancesFromLedger(players.map((p) => p.id), ledger), [players, ledger]);
  const open = sheet ?? (status === "closing" && !dismissed ? "settle" : null);

  // Pop animation for every new transfer, including the ones thrown by other players.
  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(ledger.map((e) => e.id));
      return;
    }
    const fresh = ledger.filter((e) => !seen.current!.has(e.id));
    if (!fresh.length) return;
    fresh.forEach((e) => seen.current!.add(e.id));
    setPops((p) => [...p, ...fresh.map((e) => ({ id: e.id, to: e.to, n: e.cents }))]);
    // Coins thrown by other players fly too (mine already fly via the drag gesture).
    const fl = fresh.flatMap((e): Flight[] => {
      if (e.from === meId) return [];
      const a = center(seatRefs.current[e.from] ?? null);
      const b = center(e.to === meId ? trayRef.current : (seatRefs.current[e.to] ?? null));
      return a && b ? [{ id: e.id, cents: e.cents, x0: a.x, y0: a.y, x1: b.x, y1: b.y }] : [];
    });
    if (fl.length && !reduce) {
      setFlights((f) => [...f, ...fl]);
      setTimeout(() => setFlights((f) => f.filter((q) => !fl.some((z) => z.id === q.id))), 900);
    }
    const ids = new Set(fresh.map((e) => e.id));
    setTimeout(() => setPops((p) => p.filter((q) => !ids.has(q.id))), 900);
  }, [ledger, meId, reduce]);

  const { x, y, scale, rotX, rotY, hoverId, flying, handlers } = useCoinThrow({
    seatRefs,
    trayRef,
    onLand: (to) => {
      Promise.resolve(onThrow(to, amount)).catch(() => {
        setErr("Movimento non riuscito");
        setTimeout(() => setErr(null), 2500);
      });
    },
  });

  const closeSheet = () => {
    setSheet(null);
    setDismissed(true);
  };

  return (
    <main className="relative mx-auto flex h-dvh max-w-md select-none flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
      <header className="flex items-start justify-between px-5 pt-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-gold-300/80">Stanza · {code}</p>
          <h1 className="font-display truncate text-2xl font-bold leading-tight">{roomName}</h1>
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
          {onArrange && playing && (
            <button onClick={onArrange} className="min-h-11 rounded-full bg-felt-900/70 px-4 text-sm font-semibold ring-1 ring-gold-500/50">
              Posti
            </button>
          )}
          <button onClick={() => setSheet("history")} className="min-h-11 rounded-full bg-felt-900/70 px-4 text-sm font-semibold ring-1 ring-gold-500/50">
            Storico
          </button>
        </div>
      </header>

      <section className="px-5 pt-3 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-cream-50/60">Il tuo saldo</p>
        <BalanceCounter value={balances[meId] ?? 0} className="text-6xl" />
      </section>

      <section className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-2 inset-y-4 rounded-[50%] border border-gold-500/25 bg-felt-900/30 shadow-[inset_0_10px_40px_rgba(0,0,0,.45)]" />
        {others.map((p, i) => {
          const pos = seatPos(i, others.length);
          const hot = hoverId === p.id;
          const mine = pops.filter((q) => q.to === p.id);
          return (
            <div key={p.id} className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${pos.left}%`, top: `${pos.top}%` }}>
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
                  {mine.map((q) => (
                    <motion.span key={q.id} className="pointer-events-none absolute inset-0 rounded-full border-4 border-gold-300" initial={{ scale: 0.8, opacity: 0.9 }} animate={{ scale: 2.2, opacity: 0 }} transition={{ duration: 0.7 }} />
                  ))}
                </AnimatePresence>
                <AnimatePresence>
                  {mine.map((q) => (
                    <motion.span key={`n${q.id}`} className="font-display pointer-events-none absolute -top-2 left-1/2 text-2xl font-extrabold text-gold-300 drop-shadow" initial={{ y: 0, x: "-50%", opacity: 1 }} animate={{ y: -46, opacity: 0 }} transition={{ duration: 0.85, ease: "easeOut" }}>
                      +{fmtCoin(q.n)}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </motion.div>
              <span className="mt-1 max-w-full truncate text-xs font-semibold">{p.name}</span>
              <BalanceCounter value={balances[p.id] ?? 0} className="text-lg" />
            </div>
          );
        })}
        {others.length === 0 && <p className="absolute inset-0 grid place-items-center px-10 text-center text-cream-50/70">Aspetta che qualcuno entri nella stanza.</p>}
      </section>

      <footer className="px-5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="-mx-2 mb-3 flex justify-center gap-1" role="radiogroup" aria-label="Scegli la moneta">
          {DENOMS.map((d) => (
            <button key={d.cents} role="radio" aria-checked={amount === d.cents} aria-label={fmtCoin(d.cents)} onClick={() => setAmount(d.cents)} className={`grid h-11 w-10 place-items-center rounded-xl transition ${amount === d.cents ? "bg-felt-900 ring-2 ring-gold-300" : "opacity-70 active:scale-95"}`}>
              <Coin cents={d.cents} size={36} />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="w-24 text-xs leading-snug text-cream-50/70">
            {!playing ? "Partita chiusa" : ledger.length === 0 ? "Trascina la moneta su un amico" : "Lancia di nuovo!"}
          </p>
          <div ref={trayRef} className={`relative grid h-28 w-28 place-items-center rounded-full border-2 border-dashed border-gold-500/50 bg-felt-900/70 shadow-[inset_0_6px_18px_rgba(0,0,0,.55)] ${playing ? "" : "opacity-40"}`}>
            <motion.div
              drag={playing && !flying && others.length > 0}
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
          {playing && canClose ? (
            <button onClick={() => setSheet("settle")} className="min-h-11 w-24 rounded-2xl bg-berry-600 px-2 text-sm font-bold shadow-lg ring-1 ring-gold-300/60 active:scale-95">
              Chiudi partita
            </button>
          ) : !playing ? (
            <button onClick={() => setSheet("settle")} className="min-h-11 w-24 rounded-2xl bg-berry-600 px-2 text-sm font-bold shadow-lg ring-1 ring-gold-300/60 active:scale-95">
              Vedi pagamenti
            </button>
          ) : (
            <span className="w-24" />
          )}
        </div>
      </footer>

      {flights.map((f) => (
        <motion.div
          key={f.id}
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-40"
          style={{ marginLeft: -22, marginTop: -22, filter: "drop-shadow(0 8px 6px rgba(0,0,0,.45))" }}
          initial={{ x: f.x0, y: f.y0, scale: 0.9, opacity: 1 }}
          animate={{ x: f.x1, y: [f.y0, Math.min(f.y0, f.y1) - 70, f.y1], scale: [0.9, 1.5, 0.9], opacity: [1, 1, 0.9] }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          <motion.div animate={{ rotateY: 720 }} transition={{ duration: 0.7, ease: "linear" }}>
            <Coin cents={f.cents} size={44} />
          </motion.div>
        </motion.div>
      ))}

      <AnimatePresence>
        {err && (
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-x-0 bottom-40 z-50 mx-auto w-fit rounded-full bg-berry-800 px-4 py-2 text-sm font-semibold ring-1 ring-gold-300/60">
            {err}
          </motion.p>
        )}
      </AnimatePresence>

      <Sheet open={open === "history"} onClose={closeSheet} title="Storico">
        {ledger.length === 0 ? (
          <p className="text-cream-50/70">Ancora nessun movimento.</p>
        ) : (
          <ul className="space-y-2">
            {[...ledger].reverse().map((e) => (
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
      <SettleSheet
        open={open === "settle"}
        onClose={closeSheet}
        balances={balances}
        players={players}
        meId={meId}
        status={status}
        canClose={canClose && playing}
        payments={payments}
        onConfirmClose={async () => {
          await onClose?.();
        }}
        onApprove={(id) => onApprove?.(id)}
        onReceived={(id) => onReceived?.(id)}
        onSetPaypal={(h) => onSetPaypal?.(h)}
      />
    </main>
  );
}
