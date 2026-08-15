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

## Status: implemented

Autosave/restore: `src/store/schemaStore.ts` subscribes to store changes, debounces 500ms, and persists `schema` to `localStorage` (`db-designer:schema`); `loadPersistedSchema()` seeds the store on init, best-effort (try/catch around storage access, since private browsing/quota can fail it silently).

Undo/redo: `zundo`'s `temporal` middleware wraps the store, with a custom debounced/coalesced `handleSet` (see step 2's Status) so one burst of writes (e.g. fast typing, or "add table" which does two writes) becomes one undo step. `App.tsx` binds Cmd/Ctrl+Z (Shift for redo) and Cmd/Ctrl+Y globally, deferring to CodeMirror's own keymap while focus is inside `.cm-editor` (so DBML text edits get CodeMirror's character-level undo, not schema-level undo, while typing — schema-level undo still applies to diagram edits and to the DBML editor once its own history is exhausted, since the debounced parse still lands in the shared store).

Empty state: `DbmlEditor.tsx` seeds a `STARTER_DBML` sample (two tables + a ref) on a genuinely fresh session (only when the restored/loaded schema has zero tables); `Canvas.tsx` also shows a "No tables yet..." overlay hint when `schema.tables.length === 0`.

Error boundaries: `src/components/ErrorBoundary.tsx`, wrapped separately around `DbmlEditor` and `Canvas` in `App.tsx` (labeled per pane) so a crash in one doesn't blank the other; each shows a "Try again" reset button.

Keyboard shortcuts implemented: Cmd/Ctrl+Z/Shift+Z/Y (undo/redo), Cmd/Ctrl+S (export), Backspace/Delete for selected diagram node/edge (React Flow's `deleteKeyCode`, step 7).

**Not done / open**: no dedicated pass on large-schema performance (many tables) — not stress-tested, still a candidate for future work (see step 00).
