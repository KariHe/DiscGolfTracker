# 04: Restore gap fill

**What to build:** When a restored record's id already exists on the device, local values still win, but empty fields are filled from the Backup and the record counts as "updated" in the summary. See ADR-0004 and the spec (merge rules).

**Blocked by:** 03 (Restore, add new records)

**Status:** ready-for-agent

- [ ] Course: `location` is filled when the local one is empty
- [ ] Layout: per-hole lengths are filled when the hole counts match; pars are never changed (ADR-0002)
- [ ] Round: `note` and `date` are filled when missing; missing hole scores are filled only when the layout is the same, and only for players in both rounds; no players are added
- [ ] `archived` is never changed; archived local records (and layouts of archived local courses) are left alone
- [ ] The local Active Round is left alone even when the Backup has the same id finished
- [ ] A restore that fills nothing reports the record as skipped; re-running is still idempotent
- [ ] Domain tests per rule; typecheck, lint and tests pass
