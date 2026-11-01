# Disc Golf Scoring

Single-device, offline-first disc golf round tracker: one **Scorekeeper** enters every player's strokes hole by hole, against a chosen **Layout** of a **Course**.

## Language

**Course**:
A physical disc golf course, identified by name (and location), offering one or more **Layouts**.
_Avoid_: track, park

**Layout**:
A named hole configuration on a **Course** (hole count plus par per hole). A Layout with no recorded **Rounds** is freely editable; once any Round uses it, it cannot change — editing produces a new Layout with the same name and **Archives** the old one.
_Avoid_: version, configuration, tee setup

**Player**:
A person whose scores are tracked; picked from the player list for each **Round**. No player is privileged; the list is unordered.
_Avoid_: user, account, friend

**Round**:
A played session on one **Layout** by one or more **Players** on a date, holding each player's **Score** for every hole. Totals are always computed, never stored or entered.
_Avoid_: game, scorecard

**Active Round**:
The single **Round** currently in progress. At most one exists; it is deletable, and finishing it moves it to the **History**.
_Avoid_: open round, draft round

**History**:
The list of finished **Rounds**. Rounds there remain editable and deletable.
_Avoid_: log, archive (see **Archive**)

**Score**:
The stroke count a **Player** took on one hole of a **Round**. Penalties are counted inside the total; there are no separate penalty fields.
_Avoid_: result, throws (per-hole total is a count of throws; "throws" implies per-throw entry)

**Archive**:
To hide a **Course**, **Layout**, or **Player** that has recorded **History** entries so pickers stop offering it while past records stay intact. Deleted outright is only allowed when nothing references it.
_Avoid_: delete, remove, disable

**Scorekeeper**:
The person using the app, entering everyone's scores on one device. There are no per-player devices.
_Avoid_: admin, owner

## Relationships

- A **Course** offers many **Layouts**
- A **Round** uses exactly one **Layout**
- A **Round** contains one **Score** per **Player** per hole of its **Layout**
- An **Active Round** is the only **Round** not in the **History**

## Flagged ambiguities

- "Courses and their layouts": resolved — **Layout** is the hole configuration; **Course** is the physical venue. Pars live on the **Layout**, not the **Course**.
- "Archive" vs "delete": resolved — **Archive** preserves referenced records; delete is blocked while anything references the record.
