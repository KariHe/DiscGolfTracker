# 01: Prefactor — app shell and storage port

**What to build:** Replace the scaffold with a routed app shell (react-router, route stubs for all phase-1 views) where every screen from the start reads and writes through a **Storage port** interface owned by the app, selected at startup by `VITE_STORAGE_BACKEND`. Ship the in-memory adapter (including the one-Active-Round rule) as the first backend running in dev, with an adapter-agnostic port conformance suite so later adapters must pass the same tests. Wire Vitest + React Testing Library.

**Blocked by:** None (can start immediately).

**Status:** claimed

- [ ] App boots; all phase-1 routes reachable and navigable by links
- [ ] Storage port selected by env; backend in dev/test is the in-memory adapter; no app code outside the port imports a concrete backend
- [ ] Port conformance test suite passes against the in-memory adapter
- [ ] Vitest + RTL run on npm test; AGENTS.md "minimum code" respected — no state library, React state only
