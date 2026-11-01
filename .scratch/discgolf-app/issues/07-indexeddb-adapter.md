# 07: IndexedDB adapter

**What to build:** A second Storage adapter backed by browser IndexedDB implements the port and passes the same adapter-agnostic conformance suite. It becomes the `VITE_STORAGE_BACKEND` default, so the deployed app is offline-first with durable persistence; the in-memory adapter remains for tests and the port stays the only seam (ADR-0001).

**Blocked by:** 01.

**Status:** resolved

- [ ] IndexedDB adapter passes the full port conformance suite unchanged
- [ ] Default backend is IndexedDB; dev/demo can still select the in-memory adapter via env only
- [ ] Manual check: create Course/Layout/Player + round flow survives a full page reload
- [ ] No app code beyond the adapter touches IndexedDB specifics
