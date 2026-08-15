# Step 3: DBML Import (parse → store)

## Goal
User types/pastes DBML in the text pane; the store updates to match.

## What to build
- Install `@dbml/core`. Use its parser to turn DBML text into an AST, then map that AST into the `Schema` type from step 2 (write a `dbmlToSchema(ast): Schema` converter — this is the piece most likely to need iteration as edge cases in DBML syntax show up).
- Wire the code editor pane (CodeMirror or Monaco, per step 1's library choice) to:
  - hold the raw DBML text (can live in the store too, or as local editor state debounced into a parse call — pick one, document the choice here once made)
  - on change (debounced ~300ms), attempt parse; on success, call `loadSchema()`; on failure, keep the last-good schema and surface a parse error (don't blow away the diagram on a mid-typing syntax error)
- Auto-generate initial `position` values for tables that don't have layout info yet (simple grid/cascade placement — a real auto-layout pass is optional polish, not required here).
- Basic parse-error UI: inline gutter markers or a status bar message with line/column from the parser's error, non-blocking.

## Done when
- Pasting a non-trivial DBML sample (multiple tables, a few refs, PK/unique/not-null modifiers) into the editor populates the store correctly, verified by logging the resulting `Schema`.
- Typing invalid DBML doesn't crash or clear existing state; it shows an error and recovers once the syntax is fixed.

## Status: implemented

`src/dbml/parse.ts#parseDbml` (async) lazy-loads `@dbml/core` (it's multi-MB and bundles dialects this app doesn't use — see the comment there) and converts via `new Parser().parse(source, 'dbmlv2').export()`, then maps the exported database into `Schema`, generating fresh IDs and grid positions (`src/lib/layout.ts#gridPosition`) per table on every parse. Errors come back typed (`DbmlParseError[]` with line/column) by catching `@dbml/core`'s `CompilerError`.

Editor wiring lives in `src/components/DbmlEditor.tsx` (CodeMirror via `@uiw/react-codemirror`, generic SQL grammar): text is local component state, debounced 300ms (`PARSE_DEBOUNCE_MS`) into `parseDbml`, with a request-ID guard against out-of-order async results if the user types faster than the debounce. On success, `loadSchema(schema, 'editor')`; on failure, the last-good schema stays in the store and errors render in a status bar under the editor (not inline gutter markers — the plan's gutter-marker option wasn't used). A hardcoded `STARTER_DBML` sample seeds a genuinely fresh session (no restored schema).
