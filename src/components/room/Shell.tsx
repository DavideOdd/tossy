import Link from "next/link";

/** Common page frame for the non-table screens. */
export function Shell({ title, back, children }: { title: string; back?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <header className="mb-5 flex items-center gap-3">
        {back && (
          <Link href={back} aria-label="Indietro" className="grid h-11 w-11 place-items-center rounded-full bg-white/[.05] ring-1 ring-white/10">
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
  "min-h-12 w-full rounded-full bg-cream-50 text-felt-900 py-3.5 text-lg font-semibold  ring-1 ring-white/10 transition active:scale-[.97] disabled:opacity-40 disabled:shadow-none";

export function LocalNotice() {
  return (
    <p className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-xs leading-relaxed text-cream-50/70">
      <b className="text-gold-300">Modalità locale.</b> Gli altri giocatori entrano da altre schede di questo browser. Per giocare da telefoni diversi serve collegare il database (Supabase).
    </p>
  );
}
