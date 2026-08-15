# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A browser-only database schema design tool. No backend — everything runs client-side.

- Users write DBML code and a visual schema (ERD-style diagram) is generated from it.
- Users can also edit the schema visually, and the DBML source updates to match (bidirectional sync between code and diagram).
- Schemas can be exported to and imported from local disk (no server-side storage/persistence).

Stack:
- React 19 (plain, in-browser, no meta-framework/SSR)
- shadcn/ui components (built on `@base-ui/react` primitives, not Radix)
- Tailwind CSS v4
- `@xyflow/react` (React Flow) for the diagram/canvas (nodes = tables, edges = relationships)
- Zustand for app state — the single source of truth that both the DBML text and the diagram read from/write to — with `zundo` layered on for undo/redo
- `@dbml/core` for DBML parsing; a hand-written printer (`src/dbml/print.ts`) for the reverse direction
- `@uiw/react-codemirror` (CodeMirror) for the DBML text pane

## Current State

All 9 steps of the original implementation plan (see `knowledgebase/`) are implemented: DBML⇄diagram sync, visual table/field editing, relationships UI, import/export to local disk, and autosave/undo/redo/error-boundary polish. The app is functional end-to-end, not a scaffold.

`knowledgebase/` is now a reference for how the app was built and where to look when extending it, not a to-do list — see `knowledgebase/00-implementation-plan.md` for the as-built file map and ideas for follow-on work.

Package manager is **bun** (`bun.lock` present) — use `bun add`/`bun install`, not npm/yarn.

## Commands

```bash
bun install       # install dependencies
bun run dev       # start Vite dev server
bun run build     # type-check (tsc -b) then production build
bun run preview   # preview the production build locally
bun run lint      # run oxlint
```

There is no test runner configured yet.

## Architecture Notes

- Build tool is Vite (`vite.config.ts`), with `@vitejs/plugin-react`.
- Linting is via `oxlint` (`.oxlintrc.json`), not ESLint. Enabled plugins: `react`, `typescript`, `oxc`.
- TypeScript project uses project references: root `tsconfig.json` points to `tsconfig.app.json` (app code, `src/`) and `tsconfig.node.json` (Vite config). `bun run build` runs `tsc -b` across both before bundling.
- `verbatimModuleSyntax` and `erasableSyntaxOnly` are enabled in `tsconfig.app.json` — use explicit `import type`/`export type` for type-only imports, and avoid TS syntax that requires runtime transformation beyond erasure (e.g. no enums, no parameter properties).

### Actual design: DBML/diagram sync

The store (`src/store/schemaStore.ts`) holds the single normalized `Schema` (`src/types/schema.ts`: `tables[]`/`refs[]`, see there for `Field`/`Table`/`Ref` shapes). Both sides derive from it — neither the DBML text nor the React Flow graph is an independent source of truth:

1. `src/dbml/parse.ts` (`parseDbml`, via `@dbml/core`) and `src/dbml/print.ts` (`schemaToDbml`, hand-written) convert DBML text ⇄ `Schema`. `DbmlEditor.tsx` debounces (300ms) text changes into `parseDbml` → `loadSchema()`.
2. `Canvas.tsx` derives React Flow nodes/edges from `schema.tables`/`schema.refs` (memoized), and writes back to the store via `setTablePosition`/`addRef`/`removeRef` on drag/connect/delete. `TableNode.tsx`/`FieldEditor.tsx`/`RelationEdge.tsx` dispatch all structural edits (add/rename/delete table or field, edit ref cardinality) through store actions — nothing mutates React Flow node data directly.

**Feedback-loop guard**: every store mutation tags itself with a `ChangeOrigin` (`'init' | 'editor' | 'diagram' | 'import'`, see `schemaStore.ts`). `DbmlEditor.tsx` only re-prints the DBML text when `origin` is `'diagram'` or `'import'` — never `'editor'` — so parsing the user's own typed text doesn't reformat it out from under their cursor. Extend this pattern (don't bypass it) if you add new mutation sources.

**Known deviation from strict DBML round-tripping**: `Field.default` is stored as a plain string, losing whether the original DBML literal was numeric/quoted/backtick-expression; `schemaToDbml`'s `formatDefault` re-infers the syntax with regexes (see comment there), so a round trip can change a default's surface syntax while preserving meaning. Table/field layout `position` is not embedded in exported DBML (kept portable for other DBML tools) — it round-trips via the localStorage-persisted store instead, and `src/lib/layout.ts#gridPosition` re-lays-out tables that have none (e.g. DBML authored elsewhere).
