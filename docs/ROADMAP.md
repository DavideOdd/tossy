# Roadmap

Ogni fase termina con una versione **deployabile** (stessa repo = app utenti).

| Fase | Obiettivo | Uscita | Stato |
|---|---|---|---|
| 0 | Architettura, design system, docs, repo | Questa documentazione | ✅ |
| 1 | Scaffold Next.js+TS+Tailwind+Framer, Supabase locale, CI, PWA shell, token design | App vuota che builda e si deploya | ⬜ |
| 2 | Schermate statiche navigabili: landing, creazione, lobby, tavolo, storico, chiusura, approvazione, risultato | UI mobile-first completa con dati finti | ⬜ |
| 3 | Stanze e partecipanti reali: schema, RLS, `create/join_room`, lobby realtime, invito WhatsApp/QR | Più telefoni nella stessa lobby | ⬜ |
| 4 | **Moneta**: componente 3D, drag/flick, hit-test, volo, suoni, haptics, `transfer_coins`, undo | Il cuore del prodotto | ⬜ |
| 5 | Saldi e storico: vista `balances`, contatori animati, timeline, offline queue | Partita completa giocabile | ⬜ |
| 6 | Chiusura e settlement: `close_room`, algoritmo, schermata proposte (+DP opzionale) | Pagamenti proposti corretti | ⬜ |
| 7 | Approvazione e PayPal.Me: macchina a stati, link, «Ho pagato/Ricevuto», risultato finale | Ciclo completo end-to-end | ⬜ |
| 8 | Hardening e rifinitura: E2E, a11y, perf budget, test iOS/Android, tuning feel del gesto | v1.0 | ⬜ |

## Backlog / idee v2
Log in with PayPal per verifica handle · altri metodi (IBAN, Satispay) · temi (Pasqua, Ferragosto) · statistiche di serata · modalità "banco" con mazziere · salvataggio storico partite per utente registrato · i18n (EN).

## Rischi
| Rischio | Mitigazione |
|---|---|
| Gesto non "naturale" su device low-end | Prototipo isolato in Fase 4 con profiling; fallback ridotto |
| Audio bloccato su iOS | Sblocco al primo gesto; UI funziona muta |
| Disputa su pagamenti | Stato `disputed`, riepilogo condivisibile |
| Limiti PayPal | Conferma manuale, metodi alternativi in v2 |
