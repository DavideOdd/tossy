"use client";
import { motion, type MotionValue } from "framer-motion";

type Rot = MotionValue<number> | number;
const EDGE_LAYERS = 7;
const HALF = 4; // half thickness in px

const faceBase: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  borderRadius: "50%",
  backfaceVisibility: "hidden",
  background:
    "radial-gradient(circle at 30% 26%, #fff6cf 0%, rgba(255,246,207,0) 36%), conic-gradient(from 210deg, #f2d98b, #d4a640, #9c7424, #e9c868, #f2d98b)",
  boxShadow: "inset 0 0 0 2px rgba(255,255,255,.28), inset 0 -5px 9px rgba(90,56,0,.5)",
};

function Face({ back = false, size }: { back?: boolean; size: number }) {
  return (
    <div style={{ ...faceBase, transform: back ? `rotateY(180deg) translateZ(${HALF + 0.5}px)` : `translateZ(${HALF + 0.5}px)` }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "repeating-conic-gradient(rgba(110,72,8,.38) 0 2deg, transparent 2deg 5deg)",
          WebkitMask: "radial-gradient(circle, transparent 85%, #000 86%)",
          mask: "radial-gradient(circle, transparent 85%, #000 86%)",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          inset: "13%",
          border: "2px solid rgba(124,86,20,.55)",
          boxShadow: "inset 0 2px 5px rgba(90,56,0,.45), 0 1px 0 rgba(255,244,190,.7)",
        }}
      />
      <span
        className="font-display absolute inset-0 grid place-items-center font-bold"
        style={{
          fontSize: size * 0.46,
          color: "#8a6420",
          textShadow: "0 1px 0 rgba(255,244,190,.85), 0 -1px 1px rgba(80,50,0,.5)",
        }}
      >
        {back ? "★" : "T"}
      </span>
      <div className="coin-shine absolute inset-0 rounded-full" />
    </div>
  );
}

export function Coin({
  size = 84,
  rotateX = 0,
  rotateY = 0,
  badge,
}: {
  size?: number;
  rotateX?: Rot;
  rotateY?: Rot;
  badge?: number;
}) {
  return (
    <div style={{ width: size, height: size, perspective: 700 }} className="relative">
      <motion.div
        style={{ width: size, height: size, rotateX, rotateY, transformStyle: "preserve-3d", position: "relative" }}
      >
        {Array.from({ length: EDGE_LAYERS }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: i % 2 ? "#8a6420" : "#a67c2a",
              transform: `translateZ(${-HALF + (i * 2 * HALF) / (EDGE_LAYERS - 1)}px)`,
            }}
          />
        ))}
        <Face size={size} />
        <Face size={size} back />
      </motion.div>
      {badge && badge > 1 ? (
        <span className="absolute -right-2 -top-2 rounded-full bg-berry-600 px-2 py-0.5 text-xs font-extrabold text-cream-50 shadow-lg ring-2 ring-gold-300">
          ×{badge}
        </span>
      ) : null}
    </div>
  );
}
