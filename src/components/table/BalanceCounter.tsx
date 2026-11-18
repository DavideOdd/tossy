"use client";
import { animate, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function BalanceCounter({ value, className = "" }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const c = animate(prev.current, value, {
      duration: 0.7,
      ease: "easeOut",
      onUpdate: (v) => setShown(Math.round(v)),
    });
    prev.current = value;
    return () => c.stop();
  }, [value]);

  const color = value > 0 ? "text-gold-300" : value < 0 ? "text-[#ff9a94]" : "text-cream-50/70";
  return (
    <motion.span
      key={value}
      initial={{ scale: 1.4 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 16 }}
      className={`tabular inline-block font-display font-extrabold ${color} ${className}`}
    >
      {shown > 0 ? "+" : shown < 0 ? "−" : ""}
      {Math.abs(shown)}
    </motion.span>
  );
}
