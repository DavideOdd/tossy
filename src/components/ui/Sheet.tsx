"use client";
import { AnimatePresence, motion } from "framer-motion";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bd"
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            key="sheet"
            role="dialog"
            aria-label={title}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[82dvh] max-w-md overflow-y-auto rounded-t-[28px] border-t border-gold-500/60 bg-walnut-900 p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-20px_60px_rgba(0,0,0,.6)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => i.offset.y > 90 && onClose()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gold-500/50" />
            <h2 className="font-display mb-4 text-2xl font-bold text-gold-300">{title}</h2>
            {children}
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}
