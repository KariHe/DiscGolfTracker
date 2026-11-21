# Versioned JSON Backup, restored by merging on id

Browsers lose data freely (ADR-0001), so the Scorekeeper needs a way to copy their data off the device and bring it back. A **Backup** is one JSON file `{ format: "discgolf-backup", version, exportedAt, data }` where `data` holds every course, layout, player and finished round (archived ones included), and **Restore** merges it into storage by record id: new ids are added; when an id already exists the local record wins and only empty fields are filled from the backup. `version` is an integer schema version, bumped only when the file shape changes; older files are lifted to the current version by a chain of migrations before validation, and files newer than the app are rejected.

## Considered Options

- Replace-all restore — rejected: the port has no clear or transaction, and wiping a device to load an older file loses anything newer
- Backup wins on conflict — rejected: overwrites newer local edits and would change pars on used layouts, breaking ADR-0002
- App semver as the version — rejected: migrations keyed on app releases are harder to reason about than a schema counter

## Consequences

- The Active Round is never exported and a file containing an unfinished round is rejected, so Restore can never hit the port's one-Active-Round rule
- Gap fills never touch pars, the `archived` flag, archived local records or the local Active Round; round scores are filled only when the layout is the same, and only for players who are in both rounds
- The whole file is validated before anything is saved, but the port has no transactions, so a storage error during saving can leave a partial restore. Re-running the restore is safe because existing records are skipped or only gap-filled
- The language preference stays out of the Backup (ADR-0003)
- Bundled course initialization keeps its own `{ courses, layouts }` format and `importCourses`; it is not a Backup
