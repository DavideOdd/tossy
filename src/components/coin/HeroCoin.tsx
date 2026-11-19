"use client";
import { animate, motion, useMotionValue } from "framer-motion";
import { useEffect } from "react";
import { Coin } from "./Coin";

export function HeroCoin() {
  const rotY = useMotionValue(-20);
  const rotX = useMotionValue(12);
  useEffect(() => {
    const a = animate(rotY, 340, { duration: 7, ease: "linear", repeat: Infinity });
    const b = animate(rotX, [12, -8, 12], { duration: 5, ease: "easeInOut", repeat: Infinity });
    return () => {
      a.stop();
      b.stop();
    };
  }, [rotX, rotY]);

  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      style={{ filter: "drop-shadow(0 22px 18px rgba(0,0,0,.55))" }}
    >
      <Coin cents={200} size={190} rotateX={rotX} rotateY={rotY} />
    </motion.div>
  );
}
