# Step 2: Schema Model & Zustand Store

## Goal
Define the normalized schema representation that both DBML and the diagram will read from and write to — the single source of truth referenced in the [core invariant](./00-implementation-plan.md#core-invariant).

## What to build
- TypeScript types for the schema model, roughly:
  ```ts
  type Table = {
    id: string
    name: string
    note?: string
    position: { x: number; y: number }   // diagram layout, not part of DBML itself
    fields: Field[]
  }
  type Field = {
    id: string
    name: string
    type: string          // e.g. "varchar(255)", "int"
    pk?: boolean
    unique?: boolean
    notNull?: boolean
    default?: string
    note?: string
  }
  type Ref = {
    id: string
    fromTableId: string
    fromFieldId: string
    toTableId: string
    toFieldId: string
    relation: '1-1' | '1-n' | 'n-1' | 'n-n'
  }
  type Schema = {
    tables: Table[]
    refs: Ref[]
  }
  ```
  Adjust against `@dbml/core`'s actual AST shape (step 3) so conversion isn't fighting an impedance mismatch — it's fine for the store model to be a simplified/flattened version of DBML's AST, but check field-by-field.
- Zustand store (`src/store/schemaStore.ts`) holding `Schema` plus actions: `addTable`, `updateTable`, `removeTable`, `addField`, `updateField`, `removeField`, `addRef`, `removeRef`, `setTablePosition`, and a bulk `loadSchema(schema)` / `replaceSchema` for import.
- Every mutation goes through store actions — no component reaches in and mutates schema objects directly.
- Note: table/field IDs are internal only (for React Flow node IDs and stable references across edits) — they are not part of DBML and must not leak into printed DBML output.

## Done when
- Store compiles, has full type coverage, and a few actions can be exercised from a temporary test harness (console or a scratch button) to confirm add/update/remove work and produce a valid `Schema` object.
