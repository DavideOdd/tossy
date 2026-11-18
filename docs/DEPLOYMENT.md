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
