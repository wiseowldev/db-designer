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

## Status: implemented

`@dbml/core` didn't expose a usable printer for this, so `src/dbml/print.ts#schemaToDbml` hand-formats DBML text directly (the plan flagged this as an acceptable fallback) — it's a straightforward line-builder over `Table`/`Field`/`Ref`, with identifier quoting (`quoteIfNeeded`) and a `formatDefault` heuristic that reconstructs numeric/expression/string syntax for `Field.default` by regex (see the deviation noted in [CLAUDE.md](../CLAUDE.md#actual-design-dbmldiagram-sync) and step 00's future-work list).

`Canvas.tsx`'s `onNodeDragStop` calls `setTablePosition`. The feedback-loop guard is the `ChangeOrigin` field from step 2: `DbmlEditor.tsx` only calls `schemaToDbml` and pushes the result into editor state when `origin` is `'diagram'` or `'import'`, skipping `'editor'` (the change it just caused by parsing) and `'init'`. Reprinting always fully normalizes formatting — the plan's "should not reformat unrelated parts" option was not pursued; this is accepted behavior, not yet called out anywhere in-app (a candidate for future polish if it surprises users).
