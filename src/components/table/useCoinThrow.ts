"use client";
import { animate, useMotionValue, useReducedMotion, type PanInfo } from "framer-motion";
import { useState, type MutableRefObject, type RefObject } from "react";
import { hapticArrive, hapticPickup } from "@/lib/haptics";
import { clink, thud, unlockAudio } from "@/lib/sound";

type Refs = MutableRefObject<Record<string, HTMLElement | null>>;
const spring = { type: "spring", stiffness: 220, damping: 18 } as const;
const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

function nearest(px: number, py: number, refs: Refs, max: number): string | null {
  let best: string | null = null;
  let bestD = max;
  for (const [id, el] of Object.entries(refs.current)) {
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return best;
}

/** Drag, flick, arc flight and landing of the coin. `onLand` commits the transfer. */
export function useCoinThrow(opts: { seatRefs: Refs; trayRef: RefObject<HTMLElement | null>; onLand: (id: string) => void }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const reduce = useReducedMotion();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [flying, setFlying] = useState(false);

  const reset = () => {
    [x, y, rotX, rotY].forEach((m) => animate(m, 0, spring));
    animate(scale, 1, spring);
    setHoverId(null);
  };

  const onDragStart = () => {
    unlockAudio();
    hapticPickup();
    clink(0.6);
    animate(scale, 1.18, spring);
  };

  const onDrag = (_: unknown, info: PanInfo) => {
    animate(rotY, clamp(info.velocity.x / 16, 60), spring);
    animate(rotX, clamp(-info.velocity.y / 16, 60), spring);
    setHoverId(nearest(info.point.x, info.point.y, opts.seatRefs, 96));
  };

  const onDragEnd = async (_: unknown, info: PanInfo) => {
    const direct = nearest(info.point.x, info.point.y, opts.seatRefs, 96);
    const thrown = nearest(info.point.x + info.velocity.x * 0.14, info.point.y + info.velocity.y * 0.14, opts.seatRefs, 120);
    const id = direct ?? thrown;
    const tray = opts.trayRef.current;
    const seat = id ? opts.seatRefs.current[id] : null;
    if (!id || !tray || !seat) return reset();

    const o = tray.getBoundingClientRect();
    const s = seat.getBoundingClientRect();
    const dx = s.left + s.width / 2 - (o.left + o.width / 2);
    const dy = s.top + s.height / 2 - (o.top + o.height / 2);
    const d = reduce ? 0.01 : 0.52;

    setFlying(true);
    setHoverId(id);
    await Promise.all([
      animate(x, dx, { duration: d, ease: [0.25, 0.6, 0.3, 1] }),
      animate(y, [y.get(), Math.min(y.get(), dy) - 80, dy], { duration: d, times: [0, 0.45, 1], ease: ["easeOut", "easeIn"] }),
      animate(rotY, rotY.get() + 540, { duration: d, ease: "easeOut" }),
      animate(rotX, 0, { duration: d }),
      animate(scale, [scale.get(), 1.3, 0.5], { duration: d, times: [0, 0.4, 1] }),
    ]);

    opts.onLand(id);
    thud();
    hapticArrive();
    x.set(0);
    y.set(0);
    rotX.set(0);
    rotY.set(0);
    scale.set(0.3);
    animate(scale, 1, { type: "spring", stiffness: 300, damping: 14 });
    setFlying(false);
    setHoverId(null);
  };

  return { x, y, scale, rotX, rotY, hoverId, flying, handlers: { onDragStart, onDrag, onDragEnd } };
}
