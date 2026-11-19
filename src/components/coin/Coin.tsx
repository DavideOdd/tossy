"use client";
import { motion, type MotionValue } from "framer-motion";
import { MAX_COIN_MM, denomOf, type CoinKind } from "@/lib/money";

type Rot = MotionValue<number> | number;
type Metal = { rim: string; ink: string; edge: [string, string]; hi: string };

const conic = (...c: string[]) => `conic-gradient(from 210deg, ${c.join(",")})`;
const METALS: Record<"copper" | "nordic" | "silver", Metal> = {
  copper: { rim: conic("#f4bb92", "#cf7e4c", "#8f4a26", "#e6a478", "#f4bb92"), ink: "#6b3416", edge: ["#a85c32", "#8f4a26"], hi: "#ffe6d2" },
  nordic: { rim: conic("#f2d98b", "#d4a640", "#9c7424", "#e9c868", "#f2d98b"), ink: "#8a6420", edge: ["#a67c2a", "#8a6420"], hi: "#fff6cf" },
  silver: { rim: conic("#f8fafc", "#c3c9d0", "#8d949c", "#e9edf1", "#f8fafc"), ink: "#4f565e", edge: ["#9aa1a9", "#7d848c"], hi: "#ffffff" },
};
const KINDS: Record<CoinKind, { outer: keyof typeof METALS; inner?: keyof typeof METALS }> = {
  copper: { outer: "copper" },
  nordic: { outer: "nordic" },
  bi1: { outer: "nordic", inner: "silver" },
  bi2: { outer: "silver", inner: "nordic" },
};
const EDGE_LAYERS = 7;

function Face({ cents, d, back }: { cents: number; d: number; back?: boolean }) {
  const den = denomOf(cents);
  const k = KINDS[den.kind];
  const m = METALS[k.outer];
  const inner = k.inner ? METALS[k.inner] : null;
  const half = Math.max(2, d * 0.04);
  const ink = (inner ?? m).ink;
  const num = den.label.length > 1 ? 0.36 : 0.46;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: "50%",
        backfaceVisibility: "hidden",
        transform: back ? `rotateY(180deg) translateZ(${half + 0.5}px)` : `translateZ(${half + 0.5}px)`,
        background: `radial-gradient(circle at 30% 26%, ${m.hi} 0%, transparent 36%), ${m.rim}`,
        boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.3), inset 0 -4px 8px rgba(60,35,0,.45)",
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "repeating-conic-gradient(rgba(60,40,10,.3) 0 2deg, transparent 2deg 5deg)",
          WebkitMask: "radial-gradient(circle, transparent 87%, #000 88%)",
          mask: "radial-gradient(circle, transparent 87%, #000 88%)",
        }}
      />
      {inner ? (
        <div
          className="absolute rounded-full"
          style={{
            inset: "22%",
            background: `radial-gradient(circle at 30% 26%, ${inner.hi} 0%, transparent 40%), ${inner.rim}`,
            boxShadow: "inset 0 2px 4px rgba(60,35,0,.5), 0 0 0 1.5px rgba(60,35,0,.35), 0 1px 0 rgba(255,255,255,.5)",
          }}
        />
      ) : (
        <div
          className="absolute rounded-full"
          style={{ inset: "12%", border: "1.5px solid rgba(60,35,0,.4)", boxShadow: "inset 0 2px 4px rgba(60,35,0,.35), 0 1px 0 rgba(255,255,255,.45)" }}
        />
      )}
      <div className="font-display absolute inset-0 grid place-items-center text-center font-semibold leading-none" style={{ color: ink }}>
        <span
          style={{
            fontSize: d * (inner ? 0.34 : num),
            transform: inner ? undefined : `translateY(${-d * 0.05}px)`,
            textShadow: "0 1px 0 rgba(255,255,255,.55), 0 -1px 1px rgba(40,25,0,.4)",
          }}
        >
          {back ? "T" : den.label}
        </span>
      </div>
      {!inner && !back && d > 40 && (
        <span
          className="absolute inset-x-0 text-center font-bold tracking-[0.12em]"
          style={{ bottom: "20%", fontSize: Math.max(5, d * 0.1), color: ink, opacity: 0.85 }}
        >
          {den.unit}
        </span>
      )}
      <div className="coin-shine absolute inset-0 rounded-full" />
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
              background: edge[i % 2],
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
