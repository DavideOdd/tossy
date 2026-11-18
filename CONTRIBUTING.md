# Contribuire a Tossy

## Branch e commit
- `main` sempre deployabile (protetto). Feature in `feat/<nome>`, fix in `fix/<nome>`.
- **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`), soggetto ≤ 50 caratteri, inglese.
- PR piccole, una per fase/feature; checklist DoD in [CLAUDE.md](CLAUDE.md).

## Setup (dopo Fase 1)
```bash
pnpm install
cp .env.example .env.local   # valori in docs/DEPLOYMENT.md
pnpm supabase start          # DB locale + Realtime
pnpm db:reset && pnpm dev
```

## Test
| Livello | Strumento | Cosa copre |
|---|---|---|
| Unit | Vitest | algoritmo di settlement (property-based con fast-check), validatori zod, generatore codici |
| DB | pgTAP / Supabase tests | RPC, RLS, idempotenza, stati stanza |
| E2E | Playwright (viewport mobile + 2 contesti) | lancio moneta, realtime a 2 client, flusso chiusura |
| Visual/perf | Lighthouse CI | budget: LCP < 2s su 4G, JS iniziale < 150 KB gz |

## Stile
Prettier + ESLint (`next/core-web-vitals`, `@typescript-eslint/strict`). Nomi file `kebab-case`, componenti `PascalCase`.
