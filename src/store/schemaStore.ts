import { create } from 'zustand'
import { createId } from '@/lib/id'
import type { Field, Ref, Schema, Table } from '@/types/schema'
import { emptySchema } from '@/types/schema'

type SchemaState = {
  schema: Schema

  loadSchema: (schema: Schema) => void

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

export const useSchemaStore = create<SchemaState>((set) => ({
  schema: emptySchema,

  loadSchema: (schema) => set({ schema }),

  addTable: (table) => {
    const id = createId()
    set((state) => ({
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
      schema: {
        ...state.schema,
        tables: state.schema.tables.map((t) =>
          t.id === id ? { ...t, ...patch } : t,
        ),
      },
    })),

  removeTable: (id) =>
    set((state) => ({
      schema: {
        tables: state.schema.tables.filter((t) => t.id !== id),
        refs: state.schema.refs.filter(
          (r) => r.fromTableId !== id && r.toTableId !== id,
        ),
      },
    })),

  setTablePosition: (id, position) =>
    set((state) => ({
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
      schema: {
        ...state.schema,
        refs: [...state.schema.refs, { ...ref, id }],
      },
    }))
    return id
  },

  updateRef: (id, patch) =>
    set((state) => ({
      schema: {
        ...state.schema,
        refs: state.schema.refs.map((r) =>
          r.id === id ? { ...r, ...patch } : r,
        ),
      },
    })),

  removeRef: (id) =>
    set((state) => ({
      schema: {
        ...state.schema,
        refs: state.schema.refs.filter((r) => r.id !== id),
      },
    })),
}))
