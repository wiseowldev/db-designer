# Step 7: Relationships UI

## Goal
Let users draw foreign-key relationships by connecting fields on the canvas.

## What to build
- Enable React Flow connection handles on individual field rows within `TableNode` (not just one handle per table) so a drag from one field to another expresses "this field references that field."
- `onConnect` handler validates the connection (type compatibility is a nice-to-have, not a hard requirement for v1) and calls the store's `addRef`.
- A way to set/edit relationship cardinality after creation (click an edge to open a small popover with a `1-1 / 1-n / n-1 / n-n` selector) — matches the `Ref.relation` field from step 2.
- Delete a ref by selecting its edge and pressing delete / a context menu action.

## Done when
- A user can drag from a field on one table to a field on another and get a correctly-typed ref in the store, reflected immediately in printed DBML.
- Edge selection + delete removes the ref cleanly from the store and diagram.
