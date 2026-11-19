# Calcolo saldi e ottimizzazione pagamenti

## Input / output
Saldi netti in **centesimi** `b_i` (Σ b_i = 0), sempre interi, mai float. Le monete sono tagli euro reali (1, 2, 5, 10, 20, 50 cent, 1 €, 2 €): il ledger somma direttamente i centesimi. Output: lista di pagamenti `(payer → payee, cents)`.

## Algoritmo (min-cash-flow greedy)
1. Separa creditori (`b>0`) e debitori (`b<0`); ignora i saldi 0.
2. Ordina entrambi per valore assoluto decrescente.
3. Ripeti: abbina debitore max con creditore max; `x = min(|d|, c)`; registra pagamento; sottrai; rimuovi chi arriva a 0.
4. Termina quando le liste sono vuote.

Garantisce **≤ n−1 pagamenti** (ogni passo azzera almeno un partecipante). Ottimo esatto = massimizzare i sottogruppi a somma zero (NP-difficile); per n ≤ 12 si può raffinare con DP su bitmask (`2^n`) cercando la partizione in più gruppi a somma zero — **opzionale, Fase 6**.

## Regole
- Soglia minima pagamento configurabile (default 0,50 €): residui sotto soglia → `waived` con avviso.
- Deterministico (tie-break per `member_id`) per risultati identici su ogni client.
- Implementato **due volte**: funzione SQL (verità) e `lib/settlement.ts` (anteprima UI); test di parità.

## Test (property-based, fast-check)
Σ pagamenti uscenti = Σ saldi negativi · nessun membro con saldo residuo ≠ 0 · numero pagamenti ≤ n−1 · nessun pagamento a sé stessi · invarianza all'ordine di input.
