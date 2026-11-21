Status: ready-for-agent

# Hole-change splash

## Problem Statement

When the **Scorekeeper** taps "Finish hole N", the Round screen just swaps its numbers in place. It is easy to miss that the hole changed, and nothing shows who tees first on the next hole.

## Solution

After "Finish hole N" (not on the last hole), a full-screen overlay shows the next hole and the teeing order for it. It closes by itself after 4 seconds, or right away on a tap anywhere.

## User Stories

1. As a Scorekeeper, I want an obvious full-screen signal when I move to the next hole, so that I never enter scores on the wrong hole
2. As a Scorekeeper, I want the splash to show the next hole number, par and length, so that I know what we are playing
3. As a Scorekeeper, I want the players listed in teeing order, so that the group knows who throws first
4. As a Scorekeeper, I want each player's result on the hole just played (e.g. "2 · Birdie"), so that the teeing order makes sense
5. As a Scorekeeper, I want the splash to close by itself, so that I don't need an extra tap every hole
6. As a Scorekeeper, I want to tap to close it early, so that I'm never kept waiting
7. As a Scorekeeper, I want progress-bar jumps to skip the splash, so that corrections on earlier holes stay quick
8. As a Scorekeeper playing solo, I want the same splash with my one row, so that the behaviour is consistent

## Implementation Decisions

- **Trigger:** only the "Finish hole N" button (`finishHole` in `src/views/Round.tsx`), after unentered scores are filled with par. Progress-bar hole jumps never show it. On the last hole, the button finishes the round and goes to History as today, with no splash.
- **Look:** full-screen overlay in the primary colour, over the Round screen.
- **Header:** next hole number, its par, and its length when the **Layout** has one (reuse the existing `holeOf` / `par` / `length` strings).
- **Teeing list:** one row per player: name plus strokes and score name on the hole just played (e.g. "2 · Birdie", using `scoreName` and `t.scoreNames`). No running totals.
- **Teeing order rule:** lowest strokes on the hole just played go first. Ties are broken by the teeing order of the hole before, going back recursively. Ties remaining after hole 1 keep the round's player order (the same order as the player cards).
- Teeing order is a pure function in `src/domain/scores.ts` (e.g. `teeingOrder(round, playerIds, uptoHole)`), worked out from the scores only. Nothing new is stored and the data schema stays the same.
- The player cards on the Round screen keep their fixed order and are not reordered.
- **Closing:** auto-close after 4000 ms; a tap anywhere on the overlay closes it right away. Clear the timer on close or unmount.
- **i18n:** any new strings (e.g. a "Teeing order" heading, an aria label for closing) are added to both English and Finnish dictionaries.
- **Accessibility:** the overlay is a dialog with an accessible name that includes the hole number.

## Testing Decisions

- Unit-test `teeingOrder` in the domain: lowest first, a tie broken by the previous hole, a tie traced back several holes, a tie on hole 1 falling back to the round's player order, and a single player.
- UI tests in `src/views/Round.test.tsx` through the full Round screen:
  - "Finish hole 1" shows the splash with "Hole 2", par, length, and players in teeing order with their hole-1 results
  - the splash closes after 4 s (fake timers) and on tap
  - jumping holes with the progress bar shows no splash
  - "Finish round" on the last hole goes to History with no splash
- Existing Round tests that click "Finish hole" keep passing (close or skip the splash where needed).

## Out of Scope

- Splash or summary at round end
- Running totals or a leaderboard on the splash
- Reordering player cards on the Round screen
- A setting to turn the splash off or change how long it shows
- Animations beyond a simple fade

## Further Notes

- Agreed in a grilling session on 2026-11-10.
