# 03: Layout management and immutability rule

**What to build:** Inside a Course editor, the Scorekeeper adds **Layouts** (name, hole count, par per hole) and edits them. A Layout with zero **Rounds** is edited in place; one with any Round cannot change — editing creates a new Layout with the same name and archives the old (ADR-0002). Archived layouts stay attached to historical rounds but are never offered for a new round. Per-hole par editing stays easy for typical 9/18-hole counts.

**Blocked by:** 02.

**Status:** resolved

- [ ] Create a Layout with hole count and per-hole pars; edit freely before any Round uses it
- [ ] After a Round references a Layout, editing produces a fresh selectable Layout with the same name; the old is archived and old rounds' totals vs par stay intact
- [ ] Archived layouts visible (labelled) in the course editor; never offered on new-round pickers
- [ ] Conformance suite covers the immutability/branch rule
