# Step 1: Tooling & Foundation

## Goal
Get from the stock Vite template to a styled, componentized shell ready for feature work.

## What to build
- Install and configure Tailwind CSS for Vite.
- Install shadcn/ui: run its CLI init, pick a base theme, confirm `components.json` points at the right paths (`src/components/ui`, alias config in `tsconfig.app.json`/`vite.config.ts` for `@/*`).
- Pull in the first few shadcn components actually needed soon: `button`, `dialog`, `input`, `select`, `resizable` (for the split editor/canvas layout), `tooltip`.
- Set up a base app layout: a two-pane resizable split — DBML text editor on one side, React Flow canvas on the other (a top toolbar for import/export/undo can come later, but leave room).
- Remove the Vite template boilerplate from `src/App.tsx`, `src/App.css`, unused assets (`react.svg`, `vite.svg`, `hero.png`) once the new layout replaces it.
- Decide folder structure under `src/`, e.g.:
  ```
  src/
    components/ui/       # shadcn-generated, don't hand-edit heavily
    components/          # app components (Toolbar, Editor, Canvas, ...)
    store/                # zustand store(s)
    dbml/                 # parse/print helpers, schema <-> dbml conversion
    types/                 # schema model types
  ```

## Done when
- `bun run dev` shows a resizable two-pane shell (empty editor + empty canvas) styled with Tailwind/shadcn, no leftover template content.
- `bun run build` and `bun run lint` still pass.

## Status: implemented

Tailwind v4 + shadcn/ui (on `@base-ui/react` primitives, not Radix) are installed. Layout is `src/App.tsx`: `ResizablePanelGroup` split between `DbmlEditor` and `Canvas`, each wrapped in its own `ErrorBoundary`, with `Toolbar` above. `src/components/ui/` has `button`, `checkbox`, `dialog`, `input`, `label`, `popover`, `resizable`, `select`, `tooltip`. Folder structure matches the plan (`components/`, `components/ui/`, `store/`, `dbml/`, `types/`, plus `lib/` for small shared helpers like `layout.ts`/`id.ts`/`utils.ts`).
