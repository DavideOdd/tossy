import "@fontsource-variable/fraunces";
import "@fontsource-variable/manrope";
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { Table } from "@/components/table/Table";
import { HeroCoin } from "@/components/coin/HeroCoin";

function Landing() {
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
        <a href="#table" className="block min-h-12 rounded-full bg-berry-600 py-3.5 text-lg font-extrabold shadow-[0_10px_30px_rgba(179,32,42,.45)] ring-1 ring-gold-300/70 transition active:scale-[.97]">
          Prova il tavolo
        </a>
        <button disabled className="min-h-12 w-full rounded-full bg-felt-900/70 py-3.5 font-semibold text-cream-50/60 ring-1 ring-gold-500/40">
          Entra con codice · presto
        </button>
      </div>
    </main>
  );
}

function App() {
  const [h, setH] = useState(location.hash);
  useEffect(() => {
    const f = () => setH(location.hash);
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  return h === "#table" ? <Table /> : <Landing />;
}

createRoot(document.getElementById("root")!).render(<App />);
