# Implementation Plan

Client-only DBML ⇄ visual schema designer. No backend — see [CLAUDE.md](../CLAUDE.md) for the project brief and current architecture.

## Status: all 9 steps implemented

This plan's steps 1–9 are all built and working end-to-end. See each step file for what was actually done (their "Status" sections) versus what was originally planned. As-built file map:

| Area | Files |
|---|---|
| Schema types | `src/types/schema.ts` |
| Store (state + undo/redo + autosave) | `src/store/schemaStore.ts` |
| DBML parse (text → Schema) | `src/dbml/parse.ts` |
| DBML print (Schema → text) | `src/dbml/print.ts` |
| File import/export (disk) | `src/dbml/file.ts`, `src/lib/exportSchema.ts` |
| DBML editor pane | `src/components/DbmlEditor.tsx` |
| Diagram canvas | `src/components/Canvas.tsx` |
| Table node (rename, add/edit/delete fields) | `src/components/TableNode.tsx`, `src/components/FieldEditor.tsx` |
| Relationship edges (cardinality edit) | `src/components/RelationEdge.tsx` |
| Toolbar (add table, import/export, undo/redo) | `src/components/Toolbar.tsx` |
| Layout (grid placement for new/positionless tables) | `src/lib/layout.ts` |
| Error boundaries | `src/components/ErrorBoundary.tsx` |

## Ideas for future work

Not required by any step's original "done when" bar, but worth considering for future improvement work:

- **Type compatibility on connect**: `Canvas.tsx`'s `onConnect` accepts any field-to-field connection regardless of type; step 7 flagged this as a nice-to-have.
- **`Field.default` round-trip fidelity**: see the note in [CLAUDE.md](../CLAUDE.md#actual-design-dbmldiagram-sync) — `formatDefault` in `src/dbml/print.ts` infers literal syntax by regex rather than storing it, so some default-value round trips change surface syntax.
- **Auto-layout**: only a naive row-cascade grid (`src/lib/layout.ts`) exists; no layout pass considers relationships to reduce edge crossings for large schemas.
- **Large-schema performance**: not stress-tested; step 9 flagged canvas/editor responsiveness with many tables as an open question.
- **CodeMirror DBML syntax**: the editor uses the generic SQL grammar (`@codemirror/lang-sql`), not a DBML-specific one — no DBML-aware syntax highlighting or autocomplete.
- **Crow's-foot edge notation**: `RelationEdge.tsx` renders cardinality as a plain text label (`1-1`/`1-n`/etc.), not graphical crow's-foot notation.
- **Dark mode / theme**: `DbmlEditor.tsx` is hardcoded to `githubLight`.

## Sequencing

Steps are ordered by dependency, not necessarily by priority — later steps assume earlier ones exist. Steps 1–4 are the critical path to a working end-to-end loop (DBML in, diagram out, diagram edits back out to DBML); everything after is breadth/polish.

1. [Tooling & foundation](./01-tooling-foundation.md) — Tailwind, shadcn, project structure, base layout
2. [Schema model & Zustand store](./02-schema-model-store.md) — the single source of truth both DBML and the diagram read/write
3. [DBML import: parse → store](./03-dbml-parse.md) — text editor + parser wired into the store
4. [Diagram: store → React Flow render](./04-diagram-render.md) — render tables/relationships as nodes/edges
5. [Diagram edits → store → DBML](./05-diagram-to-dbml.md) — the other half of the sync loop; DBML printer
6. [Table & field editing UI](./06-table-field-editing.md) — add/edit/delete tables, columns, types, constraints via the diagram
7. [Relationships UI](./07-relationships-ui.md) — draw/edit foreign keys via React Flow edges
8. [Import/export to local disk](./08-import-export.md) — File System Access API / download-upload fallback
9. [Persistence & polish](./09-persistence-polish.md) — autosave to localStorage, undo/redo, error handling, empty states

## Core invariant

DBML text and the React Flow graph are never edited independently. Both are views over one normalized schema object in the Zustand store:

```
DBML text --(parse)--> store --(print)--> DBML text
                          |
                       (project)
                          v
                    React Flow nodes/edges --(user edit)--> store
```

Any feature that seems to require reading from or writing directly to React Flow's graph *or* the DBML string, bypassing the store, is probably wrong — route it through the store instead.

## Suggested libraries (not yet installed)

- `@dbml/core` — DBML parsing and printing (avoid hand-rolling a parser)
- `reactflow` (or `@xyflow/react`, its current package name) — canvas/diagram
- `zustand` — store
- `tailwindcss` + shadcn/ui CLI — styling/components
- A code editor for the DBML pane: `@uiw/react-codemirror` or `@monaco-editor/react` (CodeMirror is lighter; Monaco has richer editing features)

Confirm current package names/versions before installing — don't assume the above are still accurate at implementation time.
