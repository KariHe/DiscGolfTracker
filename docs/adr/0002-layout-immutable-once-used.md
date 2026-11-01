# Layouts are immutable once a Round uses them

Editing a Layout that has recorded history would silently re-baseline every old round's totals versus par, corrupting comparisons the History exists to provide. We therefore freeze a **Layout** the moment a **Round** references it: edits create a new Layout with the same name and archive the old one, which stays attached to its historical rounds. Layouts with zero rounds are edited in place with no copies.

## Considered Options

- Snapshot pars into each Round — rejected: duplicates layout data in every record for a freeze that the immutable-Layout rule already guarantees
- Edit in place with historical recalculation — rejected: corrupts history the app's comparisons depend on

## Consequences

- "Layout" and "archived layout": archived ones stay selectable inside historical rounds but never offered when creating a new one
- Related rule (same rationale): Courses and Players referenced by history can only be archived, not deleted
