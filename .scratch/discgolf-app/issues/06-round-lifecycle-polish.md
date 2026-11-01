# 06: Round lifecycle polish

**What to build:** The Scorekeeper controls the whole Round lifecycle: delete the **Active Round** (with confirm); view a **History** Round in detail; edit a finished Round (per-hole Scores, date, note); delete a History Round. Deleting a finished Round re-runs the reference checks that unlock deletion/archiving of Courses, Layouts, Players.

**Blocked by:** 05.

**Status:** resolved

- [ ] Active Round deletable with confirmation; History list ignores it afterwards
- [ ] History detail shows course, layout, players, date, per-hole Scores, totals vs par
- [ ] Finished Round editable (scores/date/note) and deletable
- [ ] Deleting the last referencing Round unblocks delete (not archive) of referenced records
- [ ] Conformance suite covers round edit/delete and unlocked record deletion
