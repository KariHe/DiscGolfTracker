# 05: Scorekeeper round — start, score, finish

**What to build:** The Scorekeeper starts the Round: at most one **Active Round** at a time (port-enforced). Start = pick Course → selectable Layout → Players → date (defaults today). Scoring: per hole, a stroke count per Player, fast tap/stepper input, totals vs par visible live (computed, never stored). Finishing moves the Round to the **History**; entry is only stroke totals, no penalty fields.

**Blocked by:** 03, 04.

**Status:** resolved

- [ ] Port rejects starting a second Active Round; resume path deep-links to it
- [ ] Round created with date, Layout, Players; scoring updates per-player Scores per hole
- [ ] Live per-player totals and vs-par from layout pars shown while scoring
- [ ] Finish produces a History entry (course, layout, players, date, totals vs par)
- [ ] Conformance suite covers the one-Active-Round rule and Round persistence
