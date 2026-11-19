"use client";
import { motion, type MotionValue } from "framer-motion";
import { MAX_COIN_MM, denomOf, type CoinKind } from "@/lib/money";

type Rot = MotionValue<number> | number;
type Metal = { fill: string; ink: string; edge: string };

// Flat, matte metals: one tone per metal, a darker edge for thickness.
const METALS: Record<"copper" | "nordic" | "silver", Metal> = {
  copper: { fill: "#c98a62", ink: "#5b2f17", edge: "#a96d49" },
  nordic: { fill: "#dcbc6c", ink: "#66501a", edge: "#b99a50" },
  silver: { fill: "#d9dde1", ink: "#3d444b", edge: "#aeb4ba" },
};
const KINDS: Record<CoinKind, { outer: keyof typeof METALS; inner?: keyof typeof METALS }> = {
  copper: { outer: "copper" },
  nordic: { outer: "nordic" },
  bi1: { outer: "nordic", inner: "silver" },
  bi2: { outer: "silver", inner: "nordic" },
};
const EDGE_LAYERS = 5;

function Face({ cents, d, back }: { cents: number; d: number; back?: boolean }) {
  const den = denomOf(cents);
  const k = KINDS[den.kind];
  const m = METALS[k.outer];
  const inner = k.inner ? METALS[k.inner] : null;
  const half = Math.max(2, d * 0.04);
  const ink = (inner ?? m).ink;
  const big = den.label.length > 1 ? 0.36 : 0.46;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        backfaceVisibility: "hidden",
        transform: back ? `rotateY(180deg) translateZ(${half + 0.5}px)` : `translateZ(${half + 0.5}px)`,
        background: `linear-gradient(160deg, rgba(255,255,255,.18), rgba(255,255,255,0) 55%), ${m.fill}`,
        boxShadow: `inset 0 0 0 ${Math.max(1, d * 0.012)}px rgba(0,0,0,.08)`,
      }}
    >
      {inner ? (
        <div className="absolute rounded-full" style={{ inset: "20%", background: `linear-gradient(160deg, rgba(255,255,255,.18), rgba(255,255,255,0) 55%), ${inner.fill}`, boxShadow: "0 0 0 1px rgba(0,0,0,.1)" }} />
      ) : (
        <div className="absolute rounded-full" style={{ inset: "9%", border: `1px solid ${m.ink}`, opacity: 0.22 }} />
      )}
      <div className="font-display absolute inset-0 grid place-items-center text-center leading-none" style={{ color: ink }}>
        <span style={{ fontSize: d * (inner ? 0.34 : big), fontWeight: 600, transform: inner || back || d <= 40 ? undefined : `translateY(${-d * 0.05}px)` }}>
          {back ? "T" : den.label}
        </span>
      </div>
      {!inner && !back && d > 40 && (
        <span className="absolute inset-x-0 text-center font-semibold" style={{ bottom: "21%", fontSize: Math.max(5, d * 0.1), color: ink, opacity: 0.7, letterSpacing: "0.04em" }}>
          {den.unit.toLowerCase()}
        </span>
      )}
    </div>
  );
}

/** A real euro coin, drawn in 3D. `size` = diameter in px of the largest coin (€2); others scale by real mm. */
export function Coin({ cents, size = 84, rotateX = 0, rotateY = 0 }: { cents: number; size?: number; rotateX?: Rot; rotateY?: Rot }) {
  const den = denomOf(cents);
  const d = Math.round((size * den.mm) / MAX_COIN_MM);
  const half = Math.max(2, d * 0.04);
  const edge = METALS[KINDS[den.kind].outer].edge;
  return (
    <div style={{ width: d, height: d, perspective: 700 }} className="relative">
      <motion.div style={{ width: d, height: d, rotateX, rotateY, transformStyle: "preserve-3d", position: "relative" }}>
        {Array.from({ length: EDGE_LAYERS }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: edge,
              transform: `translateZ(${-half + (i * 2 * half) / (EDGE_LAYERS - 1)}px)`,
            }}
          />
        ))}
        <Face cents={cents} d={d} />
        <Face cents={cents} d={d} back />
      </motion.div>
    </div>
  );
}
