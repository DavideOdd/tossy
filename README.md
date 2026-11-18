# 🪙 Tossy — *Pass the coin*

Le monetine dei giochi natalizi, ma digitali. Si crea una stanza, gli amici entrano da un link WhatsApp, e le monete si **lanciano con un gesto** verso l'avatar di chi vince. A fine partita Tossy calcola chi deve pagare chi, con il minor numero di pagamenti, e genera i link PayPal — **mai nessun addebito automatico**.

> Stato: **Fase 0 — documentazione e architettura** · Repo privata · Vedi [ROADMAP](docs/ROADMAP.md)

## In una frase
Un tavolo di gioco condiviso in tempo reale dove il passaggio della moneta è l'esperienza (drag, lancio, suono, saldo animato) e il denaro vero si muove solo dopo approvazione esplicita.

## Come funziona
1. **Crea** una stanza → codice a 6 caratteri + link di invito.
2. **Entra** con nome e avatar; aggiungi il tuo `PayPal.Me` (opzionale fino alla chiusura).
3. **Gioca**: trascina una moneta sull'avatar di un amico.
4. **Chiudi**: l'organizzatore blocca il tavolo, Tossy propone i pagamenti ottimizzati.
5. **Approva & paga**: ognuno approva i propri pagamenti, poi apre il link PayPal.Me precompilato.

## Stack
Next.js (App Router) · TypeScript · Tailwind CSS · Framer Motion · Supabase (Postgres + Realtime + RLS + Auth anonima) · Vercel · PWA.
Motivazioni in [ADR-0001](docs/adr/0001-stack.md).

## Indice documentazione
| Documento | Contenuto |
|---|---|
| [docs/BRIEF.md](docs/BRIEF.md) | Brief originale (fonte di verità dei requisiti) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architettura, flussi, struttura cartelle |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Schema DB, stati, RPC, RLS |
| [docs/SETTLEMENT_ALGORITHM.md](docs/SETTLEMENT_ALGORITHM.md) | Calcolo saldi e ottimizzazione pagamenti |
| [docs/PAYPAL.md](docs/PAYPAL.md) | Fattibilità tecnica PayPal e scelta di integrazione |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Palette, tipografia, componenti, motion |
| [docs/UX_COIN_INTERACTION.md](docs/UX_COIN_INTERACTION.md) | Specifica del gesto moneta + schermate |
| [docs/SECURITY.md](docs/SECURITY.md) | Sessioni, autorizzazioni, anti-doppio-pagamento, privacy |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Ambienti, variabili, deploy come web app |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Fasi, milestone, backlog |
| [docs/adr/](docs/adr) | Architecture Decision Records |
| [CLAUDE.md](CLAUDE.md) | Regole per gli agenti AI che lavorano sul repo |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Convenzioni di sviluppo, test, commit |
| [CHANGELOG.md](CHANGELOG.md) | Storico versioni |

## Nota legale
Tossy **non detiene né muove denaro**: genera richieste/link che l'utente conferma da sé su PayPal. Pensato per giochi tra amici e famiglia.
