# Storage behind a port, adapter selected by env

The app must outlive its first storage choice (browser IndexedDB) because the group will eventually want backend-synced data and untrusted browsers lose data freely. We store all persistence behind a **Storage port** interface owned by the app (courses, layouts, players, rounds; save/list/delete), and choose the adapter at startup from the `VITE_STORAGE_BACKEND` environment variable: `indexed-db` in the app, `memory` in tests. No UI switches backends and no app code knows which one is active.

## Considered Options

- Runtime UI storage switching — rejected as YAGNI; an env-selected adapter gives the same seam without admin UI
- Scattered IndexedDB calls behind one file — rejected: too weak a boundary to guarantee an API-backend swap later; the port is the contract

## Consequences

- Adapters must implement the full port and must not leak IndexedDB specifics into the app
- Durable IDs are opaque strings; adapter-specific key schemes belong to adapters
- When a real backend arrives, it ships as a third adapter plus an export/import path for one-time data migration; export/import is out of scope for phase 1
