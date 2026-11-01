# 04: Player management

**What to build:** The Scorekeeper maintains a **Player** list (add, rename). Delete is blocked while any finished **Round** references the Player; otherwise the Player **Archives**, keeping names intact wherever rounds used them. Players are an unordered list, no owner flag. All through the Storage port.

**Blocked by:** 01.

**Status:** resolved

- [ ] Add/rename Players; list usable from the round picker
- [ ] Unreferenced Player deletable; referenced Player only archivable
- [ ] Archived Players hidden from pickers, labelled where referenced
- [ ] Conformance suite covers Player persistence incl. archive rule
