# Step 8: Import/Export to Local Disk

## Goal
Users can save their schema (as `.dbml`) to disk and load it back later, entirely client-side.

## What to build
- Export: serialize current `Schema` to DBML text (reuse step 5's printer) and trigger a download. Prefer the File System Access API (`showSaveFilePicker`) where available, falling back to an `<a download>` blob-URL trick for browsers without it (notably Firefox/Safari at time of writing — verify current support before assuming).
- Import: `showOpenFilePicker` where available, `<input type="file">` fallback. Read file text, run through step 3's parser, `loadSchema()`.
- Consider also exporting table/field position layout — either embed as DBML comments/metadata (check whether `@dbml/core` preserves custom comments through parse/print round-trips) or use a project-specific `.json` export format alongside/instead of raw `.dbml` if layout fidelity matters more than DBML portability. Worth a deliberate decision, not a default — document whichever is chosen here.
- Basic guardrails: warn before import if it would discard unsaved changes (ties into step 9's persistence/dirty-state tracking).

## Done when
- Export produces a `.dbml` file that opens correctly in this app (round-trip) and is plain valid DBML usable elsewhere (e.g. dbdiagram.io) if position metadata isn't required for that use case.
- Import from a `.dbml` file authored outside this app (e.g. copied from DBML docs/examples) works without modification.

## Status: implemented

`src/dbml/file.ts`: `saveDbmlToFile`/`openDbmlFile` try the File System Access API (`showSaveFilePicker`/`showOpenFilePicker`) first and fall back to a download-blob-URL trick / `<input type="file">` respectively when unsupported (both AbortError from a cancelled picker and any other failure fall through to the fallback). `src/lib/exportSchema.ts#exportCurrentSchema` wires export to the printer (step 5). Toolbar has both buttons; `App.tsx` also binds Cmd/Ctrl+S to export.

**Decision made on the plan's open question**: table/field `position` is *not* embedded in exported DBML — exported `.dbml` is plain, portable DBML with no app-specific metadata (documented in the comment atop `file.ts`). Position instead round-trips only through the localStorage-persisted store; importing a `.dbml` with no position data (from this app after a cleared store, or authored elsewhere) re-lays it out via `gridPosition`. This favors DBML portability over layout fidelity across export/reimport.

Import guardrail: `Toolbar.tsx#handleImport` uses a native `window.confirm` (not a styled dialog) warning how many tables will be discarded, only when the current schema is non-empty.
