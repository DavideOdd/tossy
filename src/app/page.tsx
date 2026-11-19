import Link from "next/link";
import { HeroCoin } from "@/components/coin/HeroCoin";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-between px-6 py-10 text-center">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold-300/80">Giochi di Natale</p>
        <h1 className="gold-text font-display mt-2 text-7xl font-extrabold leading-none">Tossy</h1>
        <p className="font-display mt-3 text-2xl italic text-cream-50">Pass the coin</p>
      </div>

      <HeroCoin />

      <div className="w-full space-y-3">
        <p className="mb-5 text-sm leading-relaxed text-cream-50/80">
          Le monetine della tombola, ma digitali. Lancia la moneta a chi vince, a fine serata Tossy chiude i conti.
        </p>
        <Link href="/new" className="block min-h-12 rounded-full bg-berry-600 py-3.5 text-lg font-extrabold shadow-[0_10px_30px_rgba(179,32,42,.45)] ring-1 ring-gold-300/70 transition active:scale-[.97]">
          Crea una stanza
        </Link>
        <Link href="/join" className="block min-h-12 rounded-full bg-felt-900/70 py-3.5 font-semibold ring-1 ring-gold-500/60 transition active:scale-[.97]">
          Entra con codice
        </Link>
        <Link href="/table" className="block pt-2 text-sm text-cream-50/60 underline-offset-4 hover:underline">
          Prova il tavolo da solo
        </Link>
      </div>
    </main>
  );
}
