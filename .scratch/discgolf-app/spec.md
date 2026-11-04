# Disc Golf Scoring App — Spec

Status: agreed (grilling session, 2026-11-01)

## Summary

Single-device, offline-first web app: one **Scorekeeper** tracks disc golf **Rounds** for themselves and friends hole by hole. Courses and their **Layouts** are managed manually in-app. Phase 1 persistence is browser IndexedDB, but storage sits behind a port so it can be swapped for a backend API without touching app code (see ADR-0001).

## Success criteria

1. Create a **Course** (name, location) and manually add **Layouts** (name, hole count, par per hole)
2. Start exactly one **Active Round**: pick course → layout → players → date; enter stroke counts per player per hole
3. Finish the round → appears in **History** with totals vs par
4. **History** rounds are viewable, editable, deletable; **Active Round** deletable
5. Courses, Layouts, Players referenced by finished rounds can only be archived, never deleted (ADR-0002)
6. All app logic runs against the storage port; tests use an in-memory adapter; the app uses IndexedDB via `VITE_STORAGE_BACKEND` — no app code imports IndexedDB directly

## Domain model

Terms and rules: `src/GLOSSARY.md`. Entities:

- **Course**: name, location; zero or more Layouts; archived flag
- **Layout**: name, hole count, pars[] (fixed-length, per-hole), archived flag; belongs to one Course. Zero rounds → freely editable; ≥1 round → edits create a new Layout (same name) and archive the old *(settled Q8 = option a)*
- **Player**: name; archived flag. Unordered list, no owner flag *(Q16)*. Delete only when no rounds reference; otherwise archive
- **Round**: date (defaults today), note (free text), one Layout, one or more Players, per-player per-hole scores. At most one Active Round at a time. Finishing moves it to History. Scores are raw stroke totals only — no separate penalty/OB fields *(Q3)*; totals always computed, never stored

## Storage port

- Interface owned by the app: save/list/get/delete for Courses, Layouts, Players, Rounds, plus the one-Active-Round-at-a-time rule enforced at the port boundary
- Adapters implement the port in full; IDs are opaque strings (no assumptions beyond string round-trip)
- Adapter selection: `VITE_STORAGE_BACKEND` = `indexed-db` (default) | `memory` (tests)
- No export/import in phase 1 *(Q5-Q4: JSON import arrives later; manual course creation always stays possible)*

## UI

- Routing: `react-router` with real URLs (deep-link reconnects to Active Round) *(Q11)*
- Views: Home (Active Round resume / start new round entry points), Round scoring (per-hole tab or grid; per-player stroke input), Course management (list + editor, layouts with per-hole par editing), Players management, History list, History round detail
- Archived records labelled "archived" and hidden from pickers, visible where their records do (rounds referencing them)
- No stats/graphs, no extra round metadata beyond date + note *(Q6, Q13)*

## Stack & tests

- React + Vite (replaces the current scaffold in this repo) *(Q1)*; no state library — React state + storage adapter
- Vitest + React Testing Library; in-memory adapter doubles as test backend; port behavior tested adapter-agnostically *(Q12)*

## Out of scope (phase 1)

Backend API and sync, course import, JSON export/import, stats/graphs/handicaps, per-player devices or accounts, penalty/OB detail fields.

## Decisions log

Q1 replace scaffold · Q2+Q3 single-device stroke totals only · Q4 manual course entry (import later) · Q5 env-selected adapter · Q6 scope incl. round editing · Q7 Q14-F Course→Layouts language; layout immutability = new record + archive (Q14, ADR-0002) · Q9 one active round, deletable; history editable+deletable · Q10 player CRUD with archive rule · Q11 react-router, no other libs · Q12 Vitest+RTL · Q13 date + optional note only · Q15 course archive rule (same as Q10) · Q16 no owner flag · Q17 ADR-0001 + ADR-0002 written
