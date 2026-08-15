import type { Field, RefRelation, Schema, Table } from '@/types/schema'

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/

function quoteIfNeeded(name: string): string {
  if (IDENTIFIER_RE.test(name)) return name
  return `"${name.replace(/"/g, '\\"')}"`
}

function quoteNote(note: string): string {
  return `'${note.replace(/'/g, "\\'")}'`
}

// Field.default is stored as a plain string (see dbml/parse.ts's defaultToString),
// which loses whether the original DBML value was a number, a quoted string, or a
// backtick expression like `now()`. We recover a reasonable guess here: numbers
// print bare, `foo()`-shaped values print as expressions, everything else as a
// quoted string. This means a round trip (DBML -> diagram -> DBML) can change how
// a default value's syntax looks even though its meaning is preserved.
function formatDefault(value: string): string {
  if (/^-?\d+(\.\d+)?$/.test(value)) return value
  if (/^[A-Za-z_][A-Za-z0-9_]*\(.*\)$/.test(value)) return `\`${value}\``
  if (value === 'true' || value === 'false' || value === 'null') return value
  return quoteNote(value)
}

const RELATION_OPERATOR: Record<RefRelation, string> = {
  '1-1': '-',
  '1-n': '<',
  'n-1': '>',
  'n-n': '<>',
}

function printField(field: Field): string {
  const settings: string[] = []
  if (field.pk) settings.push('pk')
  if (field.increment) settings.push('increment')
  if (field.unique) settings.push('unique')
  if (field.notNull) settings.push('not null')
  if (field.default != null && field.default !== '') {
    settings.push(`default: ${formatDefault(field.default)}`)
  }
  if (field.note) settings.push(`note: ${quoteNote(field.note)}`)

  const settingsStr = settings.length > 0 ? ` [${settings.join(', ')}]` : ''
  return `  ${quoteIfNeeded(field.name)} ${field.type}${settingsStr}`
}

function printTable(table: Table): string {
  const lines = [`Table ${quoteIfNeeded(table.name)} {`, ...table.fields.map(printField)]
  if (table.note) lines.push(`  Note: ${quoteNote(table.note)}`)
  lines.push('}')
  return lines.join('\n')
}

export function schemaToDbml(schema: Schema): string {
  const tableById = new Map(schema.tables.map((t) => [t.id, t]))
  const fieldById = new Map(schema.tables.flatMap((t) => t.fields.map((f) => [f.id, f] as const)))

  const tableBlocks = schema.tables.map(printTable)

  const refLines = schema.refs.flatMap((ref) => {
    const fromTable = tableById.get(ref.fromTableId)
    const toTable = tableById.get(ref.toTableId)
    const fromField = fieldById.get(ref.fromFieldId)
    const toField = fieldById.get(ref.toFieldId)
    if (!fromTable || !toTable || !fromField || !toField) return []
    const op = RELATION_OPERATOR[ref.relation]
    return [
      `Ref: ${quoteIfNeeded(fromTable.name)}.${quoteIfNeeded(fromField.name)} ${op} ${quoteIfNeeded(toTable.name)}.${quoteIfNeeded(toField.name)}`,
    ]
  })

  return [...tableBlocks, ...refLines].join('\n\n') + (tableBlocks.length + refLines.length > 0 ? '\n' : '')
}
