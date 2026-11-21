# 03: Restore (add new records)

**What to build:** In Settings, the Scorekeeper picks a Backup file and it is **Restored**: records whose ids are not on the device are added. Existing ids are skipped and never changed. Afterwards Settings shows a translated summary per kind (added / updated / skipped), or an error, in which case nothing is saved. See ADR-0004 and the spec (validation section).

**Blocked by:** 02 (Backup export)

**Status:** ready-for-agent

- [ ] A migration chain lifts older versions to the current one before validation. It is empty for now; a test injects a fake step to prove it runs
- [ ] Rejected with nothing saved: wrong or missing `format`, non-integer version, version newer than the app ("backup from a newer app version"), bad record shape or pars/lengths, duplicate ids, any unfinished round, a reference that exists neither in the file nor on the device
- [ ] A reference that exists only on the device passes
- [ ] Restoring a Backup into empty storage reproduces its records
- [ ] Restoring the same file twice changes nothing on the second run
- [ ] Settings file picker (`.json`) shows the summary or the error; strings in English and Finnish
- [ ] Domain and UI tests; typecheck, lint and tests pass
