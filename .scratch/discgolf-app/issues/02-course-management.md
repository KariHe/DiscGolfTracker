# 02: Course management

**What to build:** The Scorekeeper creates, renames, and sets a location for **Courses** in-app. Deleting a Course is blocked while any finished round or layout references it; otherwise it **Archives** (hidden from the course picker, kept where records use it). All through the Storage port.

**Blocked by:** 01.

**Status:** resolved

- [ ] Create a Course (name + optional location); see it in the course list immediately
- [ ] Edit name/location; delete unavailable-with-history, Archive available-with-history, per spec
- [ ] Archived Courses hidden from pickers and labelled "archived" where their records do
- [ ] Conformance suite covers Course persistence incl. archive rule
