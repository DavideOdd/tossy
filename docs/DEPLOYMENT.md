# Deployment — la repo come web app

| Ambiente | Hosting | DB |
|---|---|---|
| Locale | `pnpm dev` | `supabase start` (Docker) |
| Preview | Vercel preview per PR | Supabase branch/progetto staging |
| Produzione | Vercel (`main`) | Supabase progetto prod |

## Variabili (`.env.example`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # solo server, mai NEXT_PUBLIC
NEXT_PUBLIC_APP_URL=https://tossy.example
```

## Pipeline CI (`.github/workflows/ci.yml`)
install → `pnpm check` → test DB (pgTAP) → build → Playwright su preview → Lighthouse CI.
Migrazioni applicate con `supabase db push` solo da `main` dopo CI verde.

## Go-live checklist
- [ ] Anonymous sign-ins abilitato, rate limit auth configurato
- [ ] RLS attiva su tutte le tabelle (test automatico che fallisce se manca)
- [ ] Realtime abilitato solo su `transfers`, `members`, `rooms`, `settlement_items`
- [ ] CSP/HSTS verificati · manifest PWA + icone · OG image invito
- [ ] Cron pulizia stanze · backup DB · monitoraggio errori
- [ ] Test manuale su iOS Safari e Android Chrome (audio sbloccato da gesto utente)

## Note
Su iOS l'audio WebAudio parte solo dopo un gesto: sbloccarlo al primo tap su «Entra/Crea».

## Collegare Supabase (da modalità locale a reale)
Senza variabili l'app usa la **modalità locale** (stanze condivise solo tra schede dello stesso browser). Per giocare da telefoni diversi:
1. Crea un progetto su supabase.com (piano gratuito).
2. Authentication → Providers → abilita **Anonymous sign-ins**.
3. SQL Editor → incolla ed esegui `supabase/migrations/0001_rooms_ledger.sql` (oppure `supabase db push`).
4. Project Settings → API: copia **Project URL** e **anon public key**.
5. Su GitHub: Settings → Secrets and variables → Actions → **Variables**: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (la anon key è pubblica per progetto; la protezione sono le RLS). Rilancia il workflow Pages.
6. Mai la `service_role` key nel client o nelle variabili `NEXT_PUBLIC_*`.

## GitHub Pages
`pages.yml` esegue `next build` con `NEXT_EXPORT=1` e `NEXT_PUBLIC_BASE_PATH=/<repo>`. Il link d'invito è `…/room/?c=CODICE` (codice in query string perché l'export statico non ha rotte dinamiche).

## Progetto Supabase attuale
Progetto `tossy` (ref `puqxazpjkvtzahquoaif`, Francoforte, Free). Auth → Providers → **Anonymous Sign-Ins** deve restare attivo. Il piano Free va in pausa dopo 7 giorni senza attività: riattivalo dalla dashboard. Le variabili `NEXT_PUBLIC_SUPABASE_*` sono opzionali (default nel workflow).
