# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A browser-only database schema design tool. No backend — everything runs client-side.

- Users write DBML code and a visual schema (ERD-style diagram) is generated from it.
- Users can also edit the schema visually, and the DBML source updates to match (bidirectional sync between code and diagram).
- Schemas can be exported to and imported from local disk (no server-side storage/persistence).

Intended stack (per project brief — see "Current State" below for what's actually installed):
- React (plain, in-browser, no meta-framework/SSR)
- shadcn/ui components
- Tailwind CSS
- React Flow for the diagram/canvas (nodes = tables, edges = relationships)
- Zustand for app state (likely the single source of truth that both the DBML text and the diagram read from/write to)

## Current State

This repo is currently just the stock `bun create vite` React+TS template — `src/App.tsx` is unmodified boilerplate. shadcn, Tailwind, React Flow, Zustand, and any DBML parser are **not yet installed**. When starting feature work, expect to first scaffold these in.

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

### Anticipated design (once the DBML/diagram sync is built)

Since the app must keep DBML text and the visual schema in sync bidirectionally, expect (and look for, once implemented) a single normalized schema representation in a Zustand store that both:
1. A DBML parser/printer synchronizes against (DBML text → store on parse; store → DBML text on diagram edits), and
2. React Flow reads to render nodes/edges (store → diagram) and writes to on drag/connect/edit (diagram → store).

Avoid treating the DBML text and the React Flow graph as two independently-mutable sources of truth — one should derive from the other via the store to prevent divergence/sync bugs.
