# Step 5: Diagram Edits → Store → DBML (the other half of the loop)

## Goal
Moving/editing things on the canvas updates the store, and the store's `Schema` prints back to valid DBML text in the editor pane.

## What to build
- `schemaToDbml(schema: Schema): string` — the inverse of step 3's converter. Easiest path: build a DBML AST from `Schema` and use `@dbml/core`'s exporter/printer if it exposes one; otherwise hand-format DBML text directly (it's a simple-enough grammar) — check what `@dbml/core` actually offers before committing to an approach.
- On React Flow's `onNodeDragStop`, call `setTablePosition(id, {x, y})`.
- Wire store → editor: whenever `Schema` changes for a reason *other* than "user is actively typing DBML" (i.e. it changed via diagram interaction or import), regenerate DBML text and push it into the editor.
- Guard against feedback loops: parsing DBML text writes to the store; the store writing back to DBML text must not re-trigger a parse of its own output. Track this with a source flag (e.g. `lastChangeOrigin: 'editor' | 'diagram' | 'import'`) or by only pushing to the editor when the change didn't originate there.
- Decide and document formatting stability: re-printing DBML after a diagram-only edit (e.g. just dragging a table) should not reformat unrelated parts of the user's original text if avoidable — or accept that reprinting always normalizes formatting, and say so in the UI/docs so it's not a surprise bug report.

## Done when
- Dragging a table on canvas doesn't touch the DBML text (position isn't part of DBML) but does persist in the store.
- Adding/renaming a field via a later-step UI (or a temporary test action) updates the DBML text pane correctly without disturbing editor focus/cursor when the user is mid-edit elsewhere.
- No infinite loop / stack overflow between parse and print under normal use.
