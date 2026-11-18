# UX — il gesto della moneta e le schermate

## Layout del tavolo
Tavolo ovale visto dall'alto; i partecipanti siedono attorno (self in basso). Su mobile verticale: avatar disposti su arco, **moneta del giocatore in basso al centro** nel "vassoio" con contatore.

## Gesto: sequenza
1. **Pickup**: tap/press sulla moneta → si solleva (scale 1.15, ombra allunga, tintinnio breve, vibrazione).
2. **Drag**: segue il dito con inerzia (spring), rotazione 3D proporzionale alla velocità, highlight speculare dinamico. Gli avatar si illuminano e si ingrandiscono avvicinandosi (magnetismo entro 90 px).
3. **Quantità**: rilascio singolo = 1 moneta. *Long-press* prima del drag o tap sul vassoio apre stepper (1, 2, 5, 10 / personalizzato) → moneta con badge «×N» (pila).
4. **Release/Flick**: si legge la velocità del puntatore; il punto d'arrivo = avatar più vicino alla traiettoria proiettata (hit-test + cono di tolleranza).
5. **Volo**: arco parabolico con rotazioni sull'asse, scia dorata, ombra sul feltro che si stacca e si riunisce.
6. **Arrivo**: rimbalzo sull'avatar, onda dorata, tonfo, +N fluttuante; contatori di mittente e destinatario con rolling digits (verde/oro credito, bordeaux debito).
7. **Rilascio fuori bersaglio**: la moneta torna al vassoio con molla (nessun trasferimento).
8. **Errore server**: moneta torna indietro con scossa + toast; saldo ripristinato.

## Regole
Ottimistico entro 16 ms, riconciliato via Realtime · undo di 5 s («Annulla») creando movimento inverso tracciato · anche gli altri vedono la moneta volare (evento realtime con animazione di replay) · pointer events unificati mouse/touch · `touch-action: none` sul vassoio · area tap ≥ 44 px · accessibile: alternativa a tastiera/lettore schermo (seleziona destinatario + quantità + conferma).

## Schermate
| # | Schermata | Note UX |
|---|---|---|
| 1 | Landing | Hero con moneta 3D che ruota al tilt; CTA «Crea stanza» / «Entra con codice» |
| 2 | Creazione stanza | Nome partita, valore moneta (es. 0,10 €), anteprima codice |
| 3 | Lobby | Posti attorno al tavolo che si riempiono in realtime; QR + «Invita su WhatsApp» (`wa.me`); editor avatar; PayPal.Me |
| 4 | Tavolo | Vedi sopra; header con nome partita, saldo personale, menu storico |
| 5 | Storico | Timeline filtrabile («solo miei»), righe con avatar→avatar, ora, quantità |
| 6 | Chiusura | Conferma organizzatore → tavolo si "spegne" → classifica saldi + pagamenti proposti |
| 7 | Approvazione | Una carta per pagamento: approva / contesta; poi bottone «Paga su PayPal» |
| 8 | Risultato | Podio, stato pagamenti, confetti sobri dorati, condividi riepilogo |

## Stati vuoti e offline
Banner «Riconnessione…» con coda locale idempotente (`client_tx_id`) che riprova al ritorno della rete.
