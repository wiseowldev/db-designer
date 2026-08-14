# Step 9: Persistence & Polish

## Goal
Make the app resilient to accidental tab closes and pleasant to use for real sessions, not just demos.

## What to build
- Autosave current `Schema` to `localStorage` (debounced), restore on load — separate from the explicit export/import in step 8, this is "don't lose my work if I close the tab."
- Undo/redo: given everything routes through store actions (steps 2+), consider `zundo` or a hand-rolled command stack over the store rather than relying on React Flow's own history.
- Empty state: first-load experience when there's no saved schema — a starter template or a clear "paste DBML or click Add Table to begin" prompt.
- Error boundaries around the canvas and editor so a rendering bug in one doesn't blank the whole app.
- Keyboard shortcuts worth considering: delete selected node/edge, cmd/ctrl+Z undo, cmd/ctrl+S export.
- Pass over responsive/layout edge cases: very large schemas (many tables) — does the canvas stay usable, does the editor pane handle large DBML files without lag (debounce tuning from step 3 may need revisiting).

## Done when
- Refreshing the tab mid-session restores the schema.
- Undo/redo works across both diagram edits and DBML text edits.
- A brand-new user with an empty store sees a clear starting point, not a blank screen.
