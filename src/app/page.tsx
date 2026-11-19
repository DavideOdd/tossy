import Link from "next/link";
import { HeroCoin } from "@/components/coin/HeroCoin";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-between px-6 pb-10 pt-14 text-center">
      <div>
        <h1 className="font-display text-6xl leading-none">Tossy</h1>
        <p className="mt-3 text-base text-cream-50/60">Pass the coin</p>
      </div>

      <HeroCoin />

      <div className="w-full space-y-3">
        <p className="mx-auto mb-6 max-w-[28ch] text-sm leading-relaxed text-cream-50/60">
          Le monetine della tombola, ma digitali. A fine serata Tossy chiude i conti.
        </p>
        <Link href="/new" className="block min-h-12 rounded-full bg-cream-50 py-3.5 text-lg font-semibold text-felt-900 transition active:scale-[.98]">
          Crea una stanza
        </Link>
        <Link href="/join" className="block min-h-12 rounded-full py-3.5 font-semibold ring-1 ring-white/20 transition active:scale-[.98]">
          Entra con codice
        </Link>
        <Link href="/table" className="block pt-3 text-sm text-cream-50/50 underline-offset-4 hover:underline">
          Prova il tavolo da solo
        </Link>
      </div>
    </main>
  );
}
