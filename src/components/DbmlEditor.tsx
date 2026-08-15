import { useEffect, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { githubLight } from '@uiw/codemirror-theme-github'
import { parseDbml, type DbmlParseError } from '@/dbml/parse'
import { schemaToDbml } from '@/dbml/print'
import { useSchemaStore } from '@/store/schemaStore'

const PARSE_DEBOUNCE_MS = 300

const STARTER_DBML = `Table users {
  id int [pk, increment]
  email varchar [unique, not null]
  name varchar
}

Table posts {
  id int [pk, increment]
  author_id int [not null]
  title varchar
}

Ref: posts.author_id > users.id
`

export function DbmlEditor() {
  const loadSchema = useSchemaStore((s) => s.loadSchema)
  const schema = useSchemaStore((s) => s.schema)
  const origin = useSchemaStore((s) => s.origin)
  // If the store already has a schema at mount (restored from localStorage), show
  // it instead of the starter template — don't clobber a returning user's work.
  const [text, setText] = useState(() =>
    schema.tables.length > 0 ? schemaToDbml(schema) : STARTER_DBML,
  )
  const [errors, setErrors] = useState<DbmlParseError[] | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Guards against out-of-order async parse results when the user types faster than PARSE_DEBOUNCE_MS.
  const latestRequestId = useRef(0)

  // Seed the store with the starter schema on mount, but only for a genuinely
  // fresh session — a restored schema is already in the store.
  useEffect(() => {
    if (schema.tables.length > 0) return
    parseDbml(STARTER_DBML).then((result) => {
      if (result.ok) loadSchema(result.schema, 'editor')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When the schema changed for a reason other than "the user is typing DBML"
  // (a diagram edit, an import), re-print it into the editor. Skip when the
  // change originated here — the store update we just caused by parsing is not
  // a reason to reformat the text out from under the user's cursor.
  useEffect(() => {
    if (origin === 'editor' || origin === 'init') return
    const printed = schemaToDbml(schema)
    setErrors(null)
    setText((current) => (current === printed ? current : printed))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, origin])

  function handleChange(value: string) {
    setText(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const requestId = ++latestRequestId.current
      parseDbml(value).then((result) => {
        if (requestId !== latestRequestId.current) return
        if (result.ok) {
          setErrors(null)
          loadSchema(result.schema, 'editor')
        } else {
          // Keep the last-good schema in the store; only surface the error.
          setErrors(result.errors)
        }
      })
    }, PARSE_DEBOUNCE_MS)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center border-b px-3 text-xs font-medium text-muted-foreground">
        DBML
      </div>
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={text}
          height="100%"
          theme={githubLight}
          extensions={[sql()]}
          onChange={handleChange}
          className="h-full text-sm"
        />
      </div>
      {errors && errors.length > 0 && (
        <div className="shrink-0 border-t bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errors.map((e, i) => (
            <div key={i}>
              Line {e.line}:{e.column} — {e.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
