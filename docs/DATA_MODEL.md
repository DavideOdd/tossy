# Data model (Postgres / Supabase)

## Tabelle
| Tabella | Campi principali |
|---|---|
| `rooms` | `id`, `code` (6 char unico, alfabeto senza 0/O/1/I), `name`, `status`, `currency` (EUR, fisso), `owner_id`, `created_at` |
| `members` | `id`, `room_id`, `user_id` (auth.uid), `nickname`, `avatar` (jsonb), `paypal_me` (nullable), `is_owner`, `joined_at`; UNIQUE(`room_id`,`user_id`) |
| `transfers` (ledger) | `id`, `room_id`, `from_member`, `to_member`, `cents` (int > 0, **taglio di moneta euro reale**), `client_tx_id` (UNIQUE per room), `created_at`; **append-only** (nessun UPDATE/DELETE) |
| `settlements` | `id`, `room_id`, `version`, `created_at` |
| `settlement_items` | `id`, `settlement_id`, `payer`, `payee`, `amount_cents`, `status`, `approved_at`, `paid_claimed_at`, `confirmed_at` |

`CHECK (from_member <> to_member)`. Vista `balances(room_id, member_id, cents)` = Σ ricevute − Σ date.

## Stati
- **Stanza**: `lobby → playing → closing → settling → completed` (+ `cancelled`).
- **settlement_item**: `proposed → approved → paid_claimed → confirmed` | `disputed` | `waived`.

## RPC (tutte SECURITY DEFINER, `search_path` fissato)
| Funzione | Regole |
|---|---|
| `create_room(name)` | genera codice, crea owner member |
| `join_room(code, nickname, avatar)` | solo `lobby`/`playing`; idempotente per utente |
| `set_paypal_me(room, handle)` | valida regex `^[A-Za-z0-9]{1,20}$`, solo il proprio membro |
| `start_game(room)` | solo owner, `lobby → playing` |
| `transfer_coins(room, to, cents, client_tx_id)` | stanza `playing`, mittente = `auth.uid()`, `cents` ∈ {1,2,5,10,20,50,100,200}, membro destinatario valido, idempotente su `client_tx_id` |
| `close_room(room)` | solo owner, `playing → closing`, congela il ledger |
| `compute_settlement(room)` | calcola saldi → items (algoritmo in [SETTLEMENT_ALGORITHM](SETTLEMENT_ALGORITHM.md)); ricalcolabile solo prima di approvazioni |
| `approve_item(item)` | solo `payer`, `proposed → approved` |
| `claim_paid(item)` / `confirm_received(item)` | payer / payee; transizioni valide soltanto |

## RLS
- Lettura: solo membri della stanza (`is_member(room_id)`).
- Scrittura diretta: **negata** su `transfers`, `settlement_items`, `rooms.status`; passa tutto da RPC.
- `paypal_me` leggibile solo da chi ha un `settlement_item` con quel membro (privacy).

## Invarianti
Σ saldi stanza = 0 · il ledger non cambia dopo `closing` · ogni `client_tx_id` produce al massimo un transfer.
