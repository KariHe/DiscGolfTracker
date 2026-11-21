# 02: Backup export

**What to build:** In Settings, the Scorekeeper taps a Backup button and gets a `discgolf-backup-YYYY-MM-DD.json` file. The file is a version 1 **Backup**: `{ format: "discgolf-backup", version: 1, exportedAt, data: { courses, layouts, players, rounds } }`. It holds every course, layout and player, archived ones included, and finished rounds only. Ids are kept. See ADR-0004 and the spec.

**Blocked by:** 01 (Settings page)

**Status:** resolved

- [x] Creating a Backup is a pure domain function over the Storage port (no React)
- [x] Archived courses, layouts and players and all finished rounds are included
- [x] The Active Round and the language preference are never included
- [x] The Settings button downloads the file with the local-date filename
- [x] Domain and UI tests; typecheck, lint and tests pass
