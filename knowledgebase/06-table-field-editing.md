# Step 6: Table & Field Editing UI

## Goal
Let users create and modify schema structure directly on the canvas, not just via text.

## What to build
- "Add table" action (toolbar button or canvas right-click/context menu) — creates a table with a default name and one field, placed near the viewport center or cursor.
- Inline editing on `TableNode`: click table name to rename; click a field row to edit name/type/flags (PK, unique, not null, default) — likely a small popover/inline form (shadcn `popover` + `input`/`select`) rather than a full modal, to keep it fast for repeated edits.
- Add/remove field rows within a table node.
- Delete table (with a confirm step — this is destructive and cascades to any refs pointing at it; surface that in the confirm dialog rather than silently dropping refs).
- All of the above dispatch to the step 2 store actions — nothing mutates React Flow node data directly.

## Done when
- A user can build a small schema (3-4 tables, several fields each) entirely by clicking on the canvas, with the DBML pane updating live to match.
- Deleting a table used in a ref removes or flags the dangling ref (decide behavior — likely: delete the ref too, and say so in the confirm dialog).
