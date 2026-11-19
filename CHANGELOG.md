# Changelog
Formato [Keep a Changelog](https://keepachangelog.com/it/1.1.0/), versioning [SemVer](https://semver.org/lang/it/).

## [Unreleased]
### Changed (grafica v2)
- Monete piatte e minimal: metalli opachi a tinta unita (rame, oro, argento), cifra nitida, niente zigrinatura né riflessi animati; spessore 3D mantenuto per il lancio.
- Interfaccia più minimal e pulita: sfondo piatto, niente grana, bordi sottili, pulsante primario crema, titoli più leggeri, etichette in minuscolo, icona audio al posto dell'emoji.
### Added (Fase 4)
- Posti: l'organizzatore ordina i giocatori in senso orario ("Disponi il tavolo", in lobby e a partita in corso); ognuno vede sé stesso in basso e gli altri nell'ordine reale. Migrazione `0003` (`members.seat`, `set_seats`).
- Pagamenti di fine partita: `close_room` pubblica i pagamenti (il server verifica che azzerino i saldi), il pagatore approva, solo allora compare il link PayPal.Me con importo, chi riceve conferma; a conferma totale la stanza è `completed`. Chi deve ricevere può aggiungere il PayPal.Me dal foglio pagamenti.
### Fixed
- `parsePayPalMe` accetta anche `paypal.me/nome` senza schema.
### Added (Fase 3b)
- Stanze condivise tra telefoni diversi: progetto Supabase `tossy` (eu-central-1, piano Free) con login anonimo; URL e chiave pubblica nel workflow Pages. Migrazione `0002` per chiudere le RPC ad `anon`. Provato dal vivo con 2 client (creazione, ingresso, trasferimento idempotente, chiusura riservata all'organizzatore).

### Added (Fase 3)
- Stanze: crea con nome e avatar personalizzabile, entra con codice o link, lobby con invito WhatsApp/copia link, PayPal.Me facoltativo, avvio e chiusura partita, tavolo collegato alla stanza.
- Schema Supabase `0001` (rooms, members, ledger append-only, RLS, RPC) con test su Postgres (pglite).
- `RoomRepo` con adattatore locale (BroadcastChannel) e adattatore Supabase (non ancora provato su un progetto reale).
- Next in export statico su GitHub Pages con `basePath`.

### Changed
- Le monete sono ora **euro reali** (1, 2, 5, 10, 20, 50 cent, 1 €, 2 €): importi in centesimi interi ovunque, grafica per metallo e diametro reale, saldi formattati in euro.

### Added
- `scripts/build-demo.sh`: build statica standalone della demo, funziona da qualsiasi URL; deploy automatico su GitHub Pages.
- Fase 1: scaffold Next.js 16 + TypeScript + Tailwind 4 + Framer Motion, token del design system, PWA manifest, CI GitHub Actions.
- Moneta 3D (CSS) con drag, lancio ad arco, hit-test sugli avatar, suoni WebAudio sintetizzati e haptics.
- Tavolo demo locale (`/table`) con saldi animati, storico e chiusura partita con pagamenti ottimizzati.
- `lib/settlement` (min-cash-flow, test property-based) e `lib/paypal` (link PayPal.Me) con test.
- Repository inizializzata con documentazione di progetto (architettura, data model, design system, UX moneta, PayPal, sicurezza, roadmap, ADR).
