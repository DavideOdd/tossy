# Changelog
Formato [Keep a Changelog](https://keepachangelog.com/it/1.1.0/), versioning [SemVer](https://semver.org/lang/it/).

## [Unreleased]
### Changed
- Le monete sono ora **euro reali** (1, 2, 5, 10, 20, 50 cent, 1 €, 2 €): importi in centesimi interi ovunque, grafica per metallo e diametro reale, saldi formattati in euro.

### Added
- `scripts/build-demo.sh`: build statica standalone della demo, funziona da qualsiasi URL; deploy automatico su GitHub Pages.
- Fase 1: scaffold Next.js 16 + TypeScript + Tailwind 4 + Framer Motion, token del design system, PWA manifest, CI GitHub Actions.
- Moneta 3D (CSS) con drag, lancio ad arco, hit-test sugli avatar, suoni WebAudio sintetizzati e haptics.
- Tavolo demo locale (`/table`) con saldi animati, storico e chiusura partita con pagamenti ottimizzati.
- `lib/settlement` (min-cash-flow, test property-based) e `lib/paypal` (link PayPal.Me) con test.
- Repository inizializzata con documentazione di progetto (architettura, data model, design system, UX moneta, PayPal, sicurezza, roadmap, ADR).
