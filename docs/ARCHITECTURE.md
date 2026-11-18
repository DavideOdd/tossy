# Architettura

## Principio
Una sola codebase Next.js serve **sia** lo sviluppo **sia** gli utenti finali (PWA installabile). Nessun backend custom: logica di dominio in funzioni Postgres (RPC) protette da RLS; Next.js gestisce UI, route handler sottili e SSR della landing.

```
 Browser/PWA (React, Framer Motion, WebAudio)
   │  supabase-js: Auth anonima · RPC · Realtime (WebSocket)
   ▼
 Supabase: Postgres (ledger, RLS, RPC) · Realtime · Auth
   ▲
 Next.js su Vercel: landing SSR, OG image invito, route handler (link PayPal.Me, cron pulizia stanze)
```

## Scelte chiave
| Tema | Scelta | Perché |
|---|---|---|
| Auth | Supabase **anonymous sign-in** + membership per stanza | Zero attrito (no email/password) per ospiti da WhatsApp; sessione persistente su device |
| Realtime | `postgres_changes` filtrato per `room_id` | Saldi e partecipanti sincronizzati senza server dedicato |
| Saldi | Derivati dal **ledger append-only** (vista `balances`) | Integrità, audit, nessuna deriva |
| Mutazioni | Solo RPC `SECURITY DEFINER` + idempotency key | Validazione server, anti-doppia-registrazione |
| UI state | Zustand (locale/ottimistico) + Realtime come verità | Animazione immediata, riconciliazione col server |
| Pagamenti | Link **PayPal.Me** precompilati, conferma manuale | Unica via ufficiale p2p realistica ([PAYPAL](PAYPAL.md)) |

## Flussi
**Ingresso**: link `/r/ABC123` → nome+avatar → `join_room` (crea utente anonimo se assente) → lobby.

**Lancio moneta**: drag/flick → hit-test su avatar → animazione ottimistica → `transfer_coins(room, to, amount, client_tx_id)` → Realtime aggiorna tutti; se il server rifiuta, la moneta "rimbalza" indietro.

**Chiusura**: organizzatore `close_room` (stato `closing`, movimenti bloccati) → `compute_settlement` → proposte → ogni pagante approva → link PayPal.Me → pagante "Ho pagato" → destinatario "Ricevuto" → `completed`.

## Struttura cartelle (target Fase 1)
```
src/
  app/                  # route: /, /new, /r/[code] (lobby/table/history/close/pay/result)
  components/           # coin/, avatar/, table/, ui/
  lib/                  # supabase client, settlement.ts, paypal.ts, sound.ts, haptics.ts, zod schemas
  hooks/                # useRoom, useBalances, useCoinDrag
  styles/ tokens.css
supabase/
  migrations/           # schema, RLS, RPC
  tests/                # pgTAP
public/                 # manifest, icone PWA (SVG)
docs/
```

## Performance e PWA
Budget JS iniziale < 150 KB gz; route-level code splitting; Framer Motion con `LazyMotion` + `domAnimation`; service worker per shell offline e installazione; nessuna immagine raster per la grafica (SVG/CSS/gradienti).
