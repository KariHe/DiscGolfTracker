# Disc Golf Tracker

Offline-first disc golf round tracker. One scorekeeper enters every player's strokes hole by hole, on one device.

## Features

- Courses with multiple layouts (hole count, par per hole)
- Player list
- Start a round: pick course/layout, add players
- Score entry per player per hole; totals computed
- History of finished rounds (editable, deletable)
- Archive instead of delete when records reference an item
- English / Finnish UI, locale-aware dates

## Stack

React 18, TypeScript, Vite, MUI, React Router, IndexedDB. Tests: Vitest, Testing Library. Lint: oxlint.

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve production build |
| `npm test` | Run tests |
| `npm run typecheck` | Type check |
| `npm run lint` | Lint |

## Configuration

`VITE_STORAGE_BACKEND`: `indexed-db` (default) or `memory` (non-persistent, useful for tests).

## Layout

```
src/
  domain/    types, scoring logic
  storage/   storage port + IndexedDB / in-memory adapters
  views/     screens (Home, Round, Courses, Players, History, ...)
  components/ theme/ i18n/
docs/adr/    architecture decisions
```

## Docs

- Domain language: [GLOSSARY-MAP.md](GLOSSARY-MAP.md), [src/GLOSSARY.md](src/GLOSSARY.md)
- Decisions: [docs/adr/](docs/adr/)
