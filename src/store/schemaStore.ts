import { create } from 'zustand'
import { temporal } from 'zundo'
import { createId } from '@/lib/id'
import type { Field, Ref, Schema, Table } from '@/types/schema'
import { emptySchema } from '@/types/schema'

// Tracks what triggered the last schema change, so the DBML editor can tell
// "the store changed because I just parsed this text" (skip re-printing, it
// would fight the user's cursor) apart from "the store changed some other
// way" (diagram edit, import, undo/redo — re-print the DBML text to match).
export type ChangeOrigin = 'init' | 'editor' | 'diagram' | 'import'

type SchemaState = {
  schema: Schema
  origin: ChangeOrigin

  loadSchema: (schema: Schema, origin: ChangeOrigin) => void

  addTable: (table?: Partial<Omit<Table, 'id' | 'fields'>>) => string
  updateTable: (id: string, patch: Partial<Omit<Table, 'id' | 'fields'>>) => void
  removeTable: (id: string) => void
  setTablePosition: (id: string, position: { x: number; y: number }) => void

  addField: (tableId: string, field?: Partial<Omit<Field, 'id'>>) => string | undefined
  updateField: (tableId: string, fieldId: string, patch: Partial<Omit<Field, 'id'>>) => void
  removeField: (tableId: string, fieldId: string) => void

  addRef: (ref: Omit<Ref, 'id'>) => string
  updateRef: (id: string, patch: Partial<Omit<Ref, 'id'>>) => void
  removeRef: (id: string) => void
}

const STORAGE_KEY = 'db-designer:schema'
const AUTOSAVE_DEBOUNCE_MS = 500
const UNDO_HISTORY_DEBOUNCE_MS = 400

function loadPersistedSchema(): Schema | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Schema) : null
  } catch {
    return null
  }
}

function persistSchema(schema: Schema) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schema))
  } catch {
    // Storage may be unavailable (private browsing, quota) — autosave is best-effort.
  }
}

const persisted = loadPersistedSchema()

export const useSchemaStore = create<SchemaState>()(
  temporal(
    (set) => ({
      schema: persisted ?? emptySchema,
      origin: persisted ? 'import' : 'init',

      loadSchema: (schema, origin) => set({ schema, origin }),

      addTable: (table) => {
        const id = createId()
        set((state) => ({
          origin: 'diagram',
          schema: {
            ...state.schema,
            tables: [
              ...state.schema.tables,
              {
                id,
                name: table?.name ?? 'untitled_table',
                note: table?.note,
                position: table?.position ?? { x: 0, y: 0 },
                fields: [],
              },
            ],
          },
        }))
        return id
      },

      updateTable: (id, patch) =>
        set((state) => ({
          origin: 'diagram',
          schema: {
            ...state.schema,
            tables: state.schema.tables.map((t) =>
              t.id === id ? { ...t, ...patch } : t,
            ),
          },
        })),

      removeTable: (id) =>
        set((state) => ({
          origin: 'diagram',
          schema: {
            tables: state.schema.tables.filter((t) => t.id !== id),
            refs: state.schema.refs.filter(
              (r) => r.fromTableId !== id && r.toTableId !== id,
            ),
          },
        })),

      setTablePosition: (id, position) =>
        set((state) => ({
          origin: 'diagram',
          schema: {
            ...state.schema,
            tables: state.schema.tables.map((t) =>
              t.id === id ? { ...t, position } : t,
            ),
          },
        })),

      addField: (tableId, field) => {
        const id = createId()
        let added = false
        set((state) => ({
          origin: 'diagram',
          schema: {
            ...state.schema,
            tables: state.schema.tables.map((t) => {
              if (t.id !== tableId) return t
              added = true
              return {
                ...t,
                fields: [
                  ...t.fields,
                  {
                    id,
                    name: field?.name ?? 'untitled_field',
                    type: field?.type ?? 'varchar',
                    pk: field?.pk,
                    unique: field?.unique,
                    notNull: field?.notNull,
                    increment: field?.increment,
                    default: field?.default,
                    note: field?.note,
                  },
                ],
              }
            }),
          },
        }))
        return added ? id : undefined
      },

      updateField: (tableId, fieldId, patch) =>
        set((state) => ({
          origin: 'diagram',
          schema: {
            ...state.schema,
            tables: state.schema.tables.map((t) =>
              t.id !== tableId
                ? t
                : {
                    ...t,
                    fields: t.fields.map((f) =>
                      f.id === fieldId ? { ...f, ...patch } : f,
                    ),
                  },
            ),
          },
        })),

      removeField: (tableId, fieldId) =>
        set((state) => ({
          origin: 'diagram',
          schema: {
            tables: state.schema.tables.map((t) =>
              t.id !== tableId
                ? t
                : { ...t, fields: t.fields.filter((f) => f.id !== fieldId) },
            ),
            refs: state.schema.refs.filter(
              (r) => r.fromFieldId !== fieldId && r.toFieldId !== fieldId,
            ),
          },
        })),

      addRef: (ref) => {
        const id = createId()
        set((state) => ({
          origin: 'diagram',
          schema: {
            ...state.schema,
            refs: [...state.schema.refs, { ...ref, id }],
          },
        }))
        return id
      },

      updateRef: (id, patch) =>
        set((state) => ({
          origin: 'diagram',
          schema: {
            ...state.schema,
            refs: state.schema.refs.map((r) =>
              r.id === id ? { ...r, ...patch } : r,
            ),
          },
        })),

      removeRef: (id) =>
        set((state) => ({
          origin: 'diagram',
          schema: {
            ...state.schema,
            refs: state.schema.refs.filter((r) => r.id !== id),
          },
        })),
    }),
    {
      // Only the schema needs undo history; `origin` rides along so the DBML
      // editor re-prints correctly after an undo/redo (see ChangeOrigin above).
      partialize: (state) => ({ schema: state.schema, origin: state.origin }),
      limit: 100,
      // Coalesce rapid-fire changes (fast typing in the DBML editor, a flurry of
      // diagram edits, or one UI action like "add table" that does multiple store
      // writes) into one history entry per pause, rather than one per write. The
      // *first* pastState of the burst is what undo should restore to — using the
      // latest one (e.g. a naive debounce keyed only on the trailing call) would
      // undo just the last sub-step instead of the whole burst.
      handleSet: (handleSet) => {
        let timeout: ReturnType<typeof setTimeout> | undefined
        let burstStart: Parameters<typeof handleSet>[0] | undefined
        return (pastState, replace) => {
          burstStart ??= pastState
          if (timeout) clearTimeout(timeout)
          timeout = setTimeout(() => {
            handleSet(burstStart ?? pastState, replace)
            burstStart = undefined
          }, UNDO_HISTORY_DEBOUNCE_MS)
        }
      },
    },
  ),
)

let saveTimeout: ReturnType<typeof setTimeout> | undefined
useSchemaStore.subscribe((state) => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => persistSchema(state.schema), AUTOSAVE_DEBOUNCE_MS)
})
