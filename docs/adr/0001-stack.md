# ADR-0001 — Stack tecnologico

- Stato: **Accettata** · Data: 2026-11-18

## Contesto
Web app mobile-first, multi-stanza, realtime, dati persistenti, animazioni fluide, una sola codebase che sia sviluppo e produzione, team minimo.

## Decisione
Next.js (App Router) + TypeScript strict + Tailwind CSS + Framer Motion + Supabase (Postgres, Realtime, Auth anonima, RLS) su Vercel, PWA.

## Alternative scartate
| Alternativa | Motivo |
|---|---|
| Firebase | Modello NoSQL meno adatto a ledger/vincoli; saldi derivati e transazioni più complessi |
| Backend Node + Socket.IO custom | Più codice, più infrastruttura, più superficie di sicurezza |
| App nativa / React Native | Il requisito è web app aperta da link WhatsApp senza installazione |
| Canvas/WebGL/Three.js per la moneta | Peso e complessità; CSS 3D + SVG bastano per l'effetto e restano a 60 fps |

## Conseguenze
- Logica di dominio in SQL (RPC): potente e sicura, ma richiede test pgTAP e migrazioni disciplinate.
- Vendor lock-in moderato su Supabase (Postgres standard, esportabile).
- Realtime con limiti di throughput: adeguato a stanze da ≤ 20 persone.
