"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Shell, primaryBtn } from "@/components/room/Shell";
import { normalizeCode } from "@/lib/rooms/code";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const ok = code.length === 6;
  return (
    <Shell title="Entra in una stanza" back="/">
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (ok) router.push(`/room/?c=${code}`);
        }}
      >
        <label className="block text-center">
          <span className="text-xs uppercase tracking-widest text-cream-50/60">Codice della stanza</span>
          <input
            value={code}
            onChange={(e) => setCode(normalizeCode(e.target.value))}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            autoFocus
            placeholder="ABC234"
            aria-label="Codice della stanza"
            className="font-display mt-2 h-20 w-full rounded-2xl border border-gold-500/40 bg-felt-900/70 text-center text-5xl font-extrabold tracking-[0.25em] text-gold-300 outline-none placeholder:text-cream-50/20 focus:border-gold-300"
          />
        </label>
        <button type="submit" disabled={!ok} className={primaryBtn}>
          Continua
        </button>
        <p className="text-center text-sm text-cream-50/60">Oppure apri direttamente il link d’invito che ti hanno mandato.</p>
      </form>
    </Shell>
  );
}
