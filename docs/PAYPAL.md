# PayPal — fattibilità tecnica e scelta

> Verificato il 2026-11-18 su documentazione ufficiale PayPal. Da riconfermare in Fase 7 (le condizioni variano per paese/account).

## Opzioni valutate
| Opzione | Esito | Note |
|---|---|---|
| **PayPal.Me** | ✅ **Scelta v1** | Link `paypal.me/<handle>/<importo><VALUTA>` (es. `/25EUR`); utilizzabile da tutti i tipi di account; l'utente conferma il pagamento in PayPal. Il payee comunica solo il proprio handle, non email/telefono. Nessuna credenziale nell'app. |
| **Payouts API** | ❌ | Richiede un account **Business verificato** che invia fondi dal proprio saldo: non adatta a p2p tra amici. |
| **Invoicing / Orders API** | ❌ per v1 | Pensate per merchant; implicano account business, commissioni e responsabilità fiscale dell'operatore. |
| **Log in with PayPal** | ⏳ v2 (opzionale) | Può verificare l'identità/email del partecipante ma richiede app approvata e non abilita trasferimenti; da valutare per ridurre errori di handle. |

## Decisione
**v1 = PayPal.Me deep-link + conferma manuale a due vie.** Tossy non tocca fondi, non memorizza credenziali, non può generare addebiti.

## Flusso
1. Il partecipante inserisce solo il proprio handle PayPal.Me (validato `^[A-Za-z0-9]{1,20}$`, normalizzato).
2. A chiusura, per ogni `settlement_item` approvato dal **pagante** l'app costruisce `https://paypal.me/{handle}/{euro}EUR` (importo con punto decimale, 2 decimali).
3. Il pagante apre il link, paga su PayPal, torna e tocca **«Ho pagato»**.
4. Il destinatario verifica nel proprio PayPal e tocca **«Ricevuto»** → `confirmed`.
5. Disaccordo → `disputed`, visibile a organizzatore.

## Limiti noti (da comunicare in UI)
- Tossy non può verificare il pagamento automaticamente (nessuna API p2p pubblica): la conferma è dichiarativa.
- Commissioni PayPal possibili (es. pagamento con carta, valute diverse): mostrare avviso «Scegli *Familiari e amici* / saldo o conto» senza promettere gratuità.
- Handle PayPal.Me non modificabile dall'utente una volta creato; gestire handle disattivato → fallback copia importo.
- Alternative locali (IBAN/Satispay/Revolut link) previste come "metodi di pagamento" estendibili in v2.

## Implementazione
`lib/paypal.ts`: `buildPayPalMeUrl(handle, cents, currency)` + test; nessuna chiamata di rete lato server. Link aperto in nuova scheda con `rel="noopener noreferrer"`.

## Flusso implementato (Fase 4)
1. L'organizzatore chiude: `close_room(room, payments)`; il server controlla che i pagamenti azzerino i saldi.
2. Il pagatore tocca *Approvo il pagamento* (`approve_payment`).
3. Solo dopo compare *Apri PayPal.Me* con importo precompilato (`paypal.me/<handle>/<importo>EUR`); il pagamento lo conferma l'utente su PayPal. Senza PayPal.Me del destinatario: pagamento di persona.
4. Il destinatario tocca *Ho ricevuto* (`confirm_received`); a conferma di tutti la stanza passa a `completed`.
