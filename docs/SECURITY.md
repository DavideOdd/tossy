# Sicurezza e privacy

## Sessioni e identità
Supabase anonymous auth (JWT breve + refresh, cookie `httpOnly` via `@supabase/ssr`). Identità = `auth.uid()` + membership. Perdita sessione → ingresso con codice e scelta del posto libero richiesta all'organizzatore (nessun takeover automatico).

## Autorizzazioni
| Ruolo | Può |
|---|---|
| Ospite non membro | vedere solo anteprima lobby (nome partita, n. partecipanti) |
| Membro | trasferire **solo da sé**, vedere ledger e saldi, gestire il proprio PayPal.Me, approvare i **propri** pagamenti |
| Organizzatore | avviare/chiudere partita, rimuovere membro in lobby, ricalcolare settlement prima di approvazioni |
Applicato in RLS + RPC (mai solo lato client).

## Integrità economica
Idempotency key per movimento · ledger append-only · stato stanza verificato dentro la transazione (`SELECT … FOR UPDATE` sulla stanza) · cap per movimento e rate-limit per membro · `compute_settlement` idempotente e versionato · ogni transizione di `settlement_item` validata da una macchina a stati nel DB.

## Anti-abuso
Rate limit su `create_room`/`join_room` (per IP via edge + per utente) · codici a 6 caratteri da alfabeto non ambiguo (~887M combinazioni) con throttling dei tentativi · Turnstile opzionale sulla creazione stanza · sanitizzazione nickname (lunghezza, no markup).

## PayPal e dati personali
Nessuna password/token PayPal. Si salva solo l'handle PayPal.Me, visibile solo alla controparte di un pagamento. Dati minimi: nickname, avatar, handle. Retention: stanze eliminate dopo 30 giorni da `completed` (cron). Esportazione/cancellazione su richiesta. Nessun tracking di terze parti; analytics privacy-friendly opzionale.

## Web hardening
CSP restrittiva, HSTS, `frame-ancestors 'none'`, `rel="noopener"` sui link PayPal, validazione zod su ogni input, segreti solo in variabili d'ambiente (service-role key mai nel bundle client), dipendenze monitorate (Dependabot).

## Rischi residui
Conferma pagamento dichiarativa (nessuna API p2p) · possibile contestazione tra amici → stato `disputed` e riepilogo condivisibile come prova informale.
