# App crash

Application crash with error message `TypeError: storage.list is not a function` from Home.tsx

**Blocked by:** None (can start immediately).

**Status:** resolved

## Comments

- Fixed 2026-11-01: `createStorageFromEnv` selected the `indexed-db` backend through a dynamic `import()`, so `StorageProvider` received a Promise, not an adapter — every `storage.list` call crashed. Backend map now uses a static import; regression tests in `src/storage/index.test.js` assert the returned value is a synchronous adapter object.