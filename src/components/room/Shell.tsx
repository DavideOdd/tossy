import Link from "next/link";

/** Common page frame for the non-table screens. */
export function Shell({ title, back, children }: { title: string; back?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <header className="mb-5 flex items-center gap-3">
        {back && (
          <Link href={back} aria-label="Indietro" className="grid h-11 w-11 place-items-center rounded-full bg-felt-900/70 ring-1 ring-gold-500/50">
            ←
          </Link>
        )}
        <h1 className="font-display text-3xl font-bold">{title}</h1>
      </header>
      {children}
    </main>
  );
}

export const primaryBtn =
  "min-h-12 w-full rounded-full bg-berry-600 py-3.5 text-lg font-extrabold shadow-[0_10px_30px_rgba(179,32,42,.45)] ring-1 ring-gold-300/70 transition active:scale-[.97] disabled:opacity-40 disabled:shadow-none";

export function LocalNotice() {
  return (
    <p className="rounded-2xl border border-gold-500/30 bg-felt-900/50 p-3 text-xs leading-relaxed text-cream-50/70">
      <b className="text-gold-300">Modalità locale.</b> Gli altri giocatori entrano da altre schede di questo browser. Per giocare da telefoni diversi serve collegare il database (Supabase).
    </p>
  );
}
