# CLAUDE.md — istruzioni per gli agenti su Tossy

Prodotto: **Tossy — Pass the coin**. Leggi prima [README](README.md); requisiti in [docs/BRIEF.md](docs/BRIEF.md). Lingua UI e docs: **italiano**; codice, commit e identificatori: **inglese**.

## Principi non negoziabili
1. **Il lancio della moneta è il prodotto.** Ogni scelta tecnica protegge fluidità (60 fps) e piacere del gesto.
2. **Nessun addebito automatico.** Il denaro si muove solo da PayPal, dopo azione esplicita dell'utente.
3. **Il server è la fonte di verità.** Saldi = somma del ledger append-only, mai valori scritti dal client.
4. **La stessa repo è l'app di produzione.** Niente prototipi usa-e-getta: ogni fase deve essere deployabile.

## Risparmio token (workflow)
- Leggi i doc **solo se serve**: indice in README; non rileggere file già letti nella sessione.
- Modifiche con Edit mirati, mai riscritture integrali. File sorgente < 200 righe; un componente per file.
- Niente asset binari: SVG/CSS per la grafica, **audio sintetizzato con WebAudio**, font variabili self-hosted (`next/font`).
- Genera boilerplate con CLI ufficiali (`create-next-app`, `supabase init`), non a mano.
- Test e lint in un solo comando: `pnpm check`. Non incollare log lunghi: filtra con `tail`/`grep`.
- Risposte brevi: esito + prossimo passo. (Skill `caveman` per comunicazione ultra-compressa.)

## Skill consigliate per fase
| Fase | Skill |
|---|---|
| Architettura / ADR | `engineering:system-design`, `engineering:architecture` |
| UI, motion, estetica | `anthropic-skills:frontend-design`, `theme-factory` |
| Test | `engineering:testing-strategy` |
| Docs | `engineering:documentation` |
| Release | `engineering:deploy-checklist`, `engineering:code-review` |

## Comandi (dopo Fase 1)
`pnpm dev` · `pnpm check` (typecheck+lint+test) · `pnpm db:reset` · `pnpm db:types` · `pnpm build`

## Regole di codice
- TypeScript `strict`; validazione input con **zod** sia client sia server.
- Mutazioni di denaro/monete **solo via RPC Postgres** (`transfer_coins`, `close_room`, ...), mai INSERT diretti.
- Animazioni: solo `transform`/`opacity`; rispetta `prefers-reduced-motion`; mai layout thrashing durante il drag.
- Ogni schermata mobile-first (360–430 px), poi desktop. Target tap ≥ 44 px.
- Segreti mai nel repo. Vedi [SECURITY](docs/SECURITY.md).

## Definition of Done
Typecheck/lint/test verdi · testata su mobile viewport · stato realtime coerente con 2+ client · docs e CHANGELOG aggiornati.
