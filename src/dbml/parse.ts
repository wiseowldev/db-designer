import type { Database } from '@dbml/core'
import { createId } from '@/lib/id'
import type { Field, RefRelation, Schema, Table } from '@/types/schema'

type ExportedDatabase = ReturnType<Database['export']>

// @dbml/core bundles parsers for many SQL dialects we don't use and is multiple MB —
// load it lazily so it doesn't bloat the initial page load.
let dbmlCorePromise: Promise<typeof import('@dbml/core')> | undefined
function loadDbmlCore() {
  dbmlCorePromise ??= import('@dbml/core')
  return dbmlCorePromise
}

export type DbmlParseError = {
  message: string
  line: number
  column: number
}

export type DbmlParseResult =
  | { ok: true; schema: Schema }
  | { ok: false; errors: DbmlParseError[] }

const TABLES_PER_ROW = 4
const TABLE_COLUMN_WIDTH = 280
const TABLE_ROW_HEIGHT = 240

function relationSide(relation: string): '1' | 'n' {
  return relation === '1' ? '1' : 'n'
}

function defaultToString(dbdefault: { value: unknown } | null | undefined): string | undefined {
  if (dbdefault == null) return undefined
  return String(dbdefault.value)
}

export async function parseDbml(source: string): Promise<DbmlParseResult> {
  if (source.trim() === '') {
    return { ok: true, schema: { tables: [], refs: [] } }
  }

  const { Parser, CompilerError } = await loadDbmlCore()

  let exported: ExportedDatabase
  try {
    exported = new Parser().parse(source, 'dbmlv2').export()
  } catch (err) {
    if (err instanceof CompilerError) {
      return {
        ok: false,
        errors: err.diags.map((d) => ({
          message: d.message,
          line: d.location.start.line,
          column: d.location.start.column,
        })),
      }
    }
    return {
      ok: false,
      errors: [
        {
          message: err instanceof Error ? err.message : 'Unknown DBML parse error',
          line: 1,
          column: 1,
        },
      ],
    }
  }

  const schema: Schema = { tables: [], refs: [] }
  // Keyed by "schemaName.tableName" so same-named tables in different DBML schemas don't collide.
  const tableIndex = new Map<string, { id: string; fields: Map<string, string> }>()
  let tablePosition = 0

  for (const dbmlSchema of exported.schemas) {
    for (const t of dbmlSchema.tables) {
      const tableId = createId()
      const fieldNameToId = new Map<string, string>()
      const fields: Field[] = t.fields.map((f) => {
        const fieldId = createId()
        fieldNameToId.set(f.name, fieldId)
        return {
          id: fieldId,
          name: f.name,
          type: f.type.type_name,
          pk: f.pk || undefined,
          unique: f.unique || undefined,
          notNull: f.not_null || undefined,
          default: defaultToString(f.dbdefault),
          note: f.note || undefined,
        }
      })

      const table: Table = {
        id: tableId,
        name: t.name,
        note: t.note || undefined,
        position: {
          x: (tablePosition % TABLES_PER_ROW) * TABLE_COLUMN_WIDTH,
          y: Math.floor(tablePosition / TABLES_PER_ROW) * TABLE_ROW_HEIGHT,
        },
        fields,
      }
      tablePosition += 1

      schema.tables.push(table)
      tableIndex.set(`${dbmlSchema.name}.${t.name}`, { id: tableId, fields: fieldNameToId })
    }

    for (const r of dbmlSchema.refs) {
      const [from, to] = r.endpoints
      const fromTable = tableIndex.get(`${from.schemaName ?? dbmlSchema.name}.${from.tableName}`)
      const toTable = tableIndex.get(`${to.schemaName ?? dbmlSchema.name}.${to.tableName}`)
      const fromFieldId = fromTable?.fields.get(from.fieldNames[0])
      const toFieldId = toTable?.fields.get(to.fieldNames[0])
      if (!fromTable || !toTable || !fromFieldId || !toFieldId) continue

      schema.refs.push({
        id: createId(),
        fromTableId: fromTable.id,
        fromFieldId,
        toTableId: toTable.id,
        toFieldId,
        relation: `${relationSide(from.relation)}-${relationSide(to.relation)}` as RefRelation,
      })
    }
  }

  return { ok: true, schema }
}
