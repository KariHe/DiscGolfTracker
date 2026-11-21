# 01: Settings page

**What to build:** The Scorekeeper opens Settings from a gear icon in the Home header. Settings holds the language switch and "Initialize courses", which both work exactly as before. The language switch is gone from the Home header and the initialize button is gone from Courses. Spec: `.scratch/settings-backup/spec.md`.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] The Home header gear opens the Settings page; the TabBar still has 4 tabs
- [x] Switching language from Settings works and is remembered (ADR-0003)
- [x] "Initialize courses" in Settings imports the bundled courses and shows the same result or failure message
- [x] No language switcher on Home and no initialize button on Courses
- [x] New strings exist in both English and Finnish
- [x] UI tests cover the above; existing tests updated; typecheck, lint and tests pass
