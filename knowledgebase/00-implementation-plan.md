# Implementation Plan

Client-only DBML ⇄ visual schema designer. No backend — see [CLAUDE.md](../CLAUDE.md) for the project brief and current repo state (stock Vite+React+TS template, nothing else installed yet).

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
