# Design system — "Tavolo da gioco natalizio"

> **Revisione minimal (v2).** Tavolo verde pino quasi nero, piatto (niente grana), una luce morbida dall'alto. Il colore vive nelle monete e negli avatar; l'interfaccia è carta e filetti. Azione primaria = pillola crema con testo scuro; secondaria = solo filetto `white/20`. Titoli Fraunces peso 500 senza "wonk", testo Manrope, etichette in minuscolo (niente maiuscoletto con tracking). Bordi `white/10`, niente ombre colorate. Token (nomi invariati): felt-900 `#0A1F19`, felt-700 `#14332A`, felt-500 `#1D453A`, gold-300/500/700 `#E6D3A0/#C4A25C/#8C7340`, cream-50 `#F4EFE2`, berry-600 `#A8322C`. Le sezioni sotto descrivono l'idea originale; dove differiscono, vale questa.


Direzione: gioco da tavolo elegante di una casa in montagna a Natale. Feltro verde, legno scuro, oro spazzolato, rosso bacca. Festivo ma adulto: niente fiocchi di neve clipart, niente caratteri infantili.

## Token colore
| Token | Valore | Uso |
|---|---|---|
| `--felt-900` | `#0B3B2C` | sfondo tavolo (con grana SVG) |
| `--felt-700` | `#115240` | superfici |
| `--berry-600` | `#B3202A` | azioni primarie, debito |
| `--berry-800` | `#7E141C` | pressed |
| `--gold-300/500/700` | `#F2D98B / #D4A640 / #9C7424` | monete, bordi, credito |
| `--cream-50` | `#FBF5E6` | testo su scuro, carte |
| `--walnut-900` | `#1C130E` | testo su chiaro, ombre calde |
Contrasto AA verificato per testo/sfondo; credito/debito mai solo per colore (anche segno ± e icona).

## Tipografia (self-hosted, `next/font`)
Display: **Fraunces** (variable, opsz/wonk) per titoli e saldi · Testo UI: **Manrope** · Numeri saldo: `font-variant-numeric: tabular-nums`.

## Forma e profondità
Raggio 16/24 px · ombre calde stratificate (mai nero puro) · bordi oro 1 px con highlight interno · texture feltro e legno via SVG `feTurbulence` (zero raster).

## Monete (euro reali)
Otto tagli con diametri e metalli veri: **rame** (1, 2, 5 cent), **nordic gold** (10, 20, 50 cent), **bimetalliche** (1 € oro/argento, 2 € argento/oro). Valore inciso sulla faccia, retro con "T" Tossy. Layer CSS: disco con gradiente conico per metallo, anello zigrinato (repeating-conic-gradient), highlight speculare che segue inclinazione (pointer o `DeviceOrientation`). Rotazione 3D `rotateY/rotateX` con `perspective`; spessore simulato con 6–8 layer impilati.

## Avatar
Componibili in SVG: forma testa, cappello natalizio (Babbo, elfo, renna, cappello lana), occhiali, sciarpa, colore sfondo. Generati da seed → 1 stringa JSON salvata.

## Motion
| Token | Valore |
|---|---|
| Spring UI | `stiffness 380, damping 30` |
| Spring moneta | `stiffness 220, damping 18, mass 0.8` |
| Durate | micro 120 ms · transizioni 240 ms · eventi 600 ms |
Solo `transform`/`opacity`; `prefers-reduced-motion` → fade + conteggio numerico, nessun lancio.

## Suono e haptics
Sintetizzati con WebAudio (nessun file): *tintinnio* (FM con 3 parziali inarmonici), *tonfo* feltro all'arrivo, *jingle* a chiusura. `navigator.vibrate([8])` al pickup, `[12,30,12]` all'arrivo. Mute globale persistente.

## Componenti base
`Button`, `Sheet` (bottom-sheet mobile), `Avatar`, `Coin`, `BalanceCounter` (rolling digits), `MemberSeat` (posto al tavolo con alone), `Toast`, `Stepper`, `ShareInvite`, `Ledger row`.
