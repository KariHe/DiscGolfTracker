Status: ready-for-agent

# Settings page with Backup and Restore

## Problem Statement

All data lives only in this browser's IndexedDB, and browsers lose data freely. The **Scorekeeper** has no way to save a copy or move the data to another device. Device settings are scattered: the language switcher sits in the Home header, and "Initialize courses" sits on the Courses page.

## Solution

A new Settings page (`/settings`), reached from a gear icon in the Home header. It groups the language choice, **Backup** (export a versioned JSON file), **Restore** (merge a Backup file into the device) and course initialization. See ADR-0004.

## User Stories

1. As a Scorekeeper, I want to download a Backup file, so that my rounds survive if the browser loses its data
2. As a Scorekeeper, I want to restore a Backup on another device, so that I can move my history there
3. As a Scorekeeper, I want restoring to never delete or overwrite my existing data, so that a restore can't make things worse
4. As a Scorekeeper, I want restoring the same file twice to change nothing, so that I can retry safely
5. As a Scorekeeper, I want a summary of what a restore added, updated and skipped, so that I know what happened
6. As a Scorekeeper, I want a clear error and no changes when a file is invalid or comes from a newer app, so that I never get half-broken data
7. As a Scorekeeper, I want language, backup and course initialization together in Settings, so that the main screens stay focused on playing

## Implementation Decisions

### Settings page and navigation
- New view `src/views/Settings.tsx`, route `/settings` in `src/App.tsx` inside the existing shell layout.
- Home header: a gear icon button that links to `/settings` replaces `LanguageSwitcher` (`src/views/Home.tsx:71`). The TabBar stays at 4 tabs.
- Settings sections: Language (the existing `LanguageSwitcher`), Backup (export button), Restore (file picker `<input type="file" accept="application/json,.json">`), Courses (the "Initialize courses" button).
- Move `initialize()` and its button from `src/views/Courses.tsx` to Settings with no change in behaviour: same bundled `src/data/southern-finland-courses.json`, same `importCourses`, same result message.
- i18n: move the strings to a new `settings` section, or reuse `t.courses.*` for course init, and add new strings to both English and Finnish dictionaries.

### Backup file format (version 1)
```json
{
  "format": "discgolf-backup",
  "version": 1,
  "exportedAt": "2026-11-21T10:00:00.000Z",
  "data": { "courses": [], "layouts": [], "players": [], "rounds": [] }
}
```
- Records are stored as the Storage port returns them (ids kept). `data` holds all courses, layouts and players, archived ones included, plus finished rounds only. The Active Round is never exported.
- The language preference is not included (ADR-0003).
- Domain module, e.g. `src/domain/backup.ts`, with no React in it:
  - `createBackup(storage, now): BackupFile`
  - `migrate(input): BackupFileV<current>`: reads `version` and applies steps from a `migrations` map (`{ [fromVersion]: (file) => file }`) up to `CURRENT_VERSION`. The map is empty for now. Rejects a missing or wrong `format`, a non-integer `version`, and `version > CURRENT_VERSION` ("backup from a newer app version").
  - `validateBackup(file, storage)`: rejects the whole file on any error (see below)
  - `restoreBackup(storage, input): RestoreResult`: migrate → validate → merge
- Export UI: build a Blob and download it through `<a download>` as `discgolf-backup-YYYY-MM-DD.json` (local date).

### Validation (all-or-nothing, before any save)
- Record shapes match `src/domain/types.ts`. Ids are non-empty strings and unique per kind. Pars and lengths follow the same rules as `validateImportData`.
- Any round with `finished !== true` rejects the file.
- References (`layout.courseId`, `round.layoutId`, `round.playerIds`, `round.scores` keys) must exist in the file or in local storage. Otherwise the file is rejected.
- The port has no transactions, so a storage error during saving can leave a partial restore. Re-running the restore is safe because it is idempotent.

### Merge rules (by id)
- An id that is not stored locally: save the record as it is.
- An id that is stored locally: local values always win, and only empty fields are filled ("gap fill"):
  - **Course**: `location` when the local one is empty
  - **Layout**: per-hole `lengths` when the hole counts match. `pars` are never touched (ADR-0002).
  - **Round**: `note` and `date` when the local ones are missing. Missing per-hole scores are filled only when `layoutId` is the same, and only for players in both rounds. Players are never added to a round.
  - `archived` is never changed.
- Never touched: archived local records (and, as in `importCourses`, layouts of archived local courses), and the local Active Round (even when the Backup has the same id finished).
- `RestoreResult`: per kind `{ added, updated, skipped }`. Settings shows it as a translated summary, or shows the error message on failure.

## Testing Decisions

- Domain tests for `src/domain/backup.ts` against the memory storage:
  - `createBackup` includes archived records and finished rounds, and leaves out the Active Round
  - A round trip into empty storage reproduces the records
  - Restoring the same file twice: the second run changes nothing (everything skipped)
  - Each gap-fill rule; pars untouched; archived records and the Active Round untouched; round score fill skipped when the layout differs; no players added
  - Rejections save nothing: bad format, newer version, unfinished round, dangling reference, duplicate id, invalid pars
  - A reference that only exists locally passes validation
  - Migration chain: a test-injected fake v0→v1 step runs before validation
- UI tests (`src/views/Settings.test.tsx`): the Home gear opens Settings; the language switch works from Settings; course init works from Settings and is gone from Courses; picking a file shows the summary or the error.
- Update the existing `Courses.test.tsx` and `App.test.tsx` cases that use the initialize button or the Home language switcher.

## Success Criteria

- `npm run typecheck`, `npm run lint` and `npm test` pass
- Exporting on one device and restoring on an empty one shows the same courses, players and history

## Out of Scope

- Replace-all or "wipe data" restore
- Automatic or cloud backups, Web Share API
- Including the Active Round or the language setting in a Backup
- Converting the bundled course file to the Backup format
- Any migration steps beyond the empty chain

## Further Notes

- Agreed in a grilling session on 2026-11-21. Decision record: `docs/adr/0004-versioned-json-backup-merge-by-id.md`.
