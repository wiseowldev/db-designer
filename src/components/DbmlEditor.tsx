import { useEffect, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql } from '@codemirror/lang-sql'
import { githubLight } from '@uiw/codemirror-theme-github'
import { parseDbml, type DbmlParseError } from '@/dbml/parse'
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
  const [text, setText] = useState(STARTER_DBML)
  const [errors, setErrors] = useState<DbmlParseError[] | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Guards against out-of-order async parse results when the user types faster than PARSE_DEBOUNCE_MS.
  const latestRequestId = useRef(0)

  // Seed the store with the starter schema on mount.
  useEffect(() => {
    parseDbml(text).then((result) => {
      if (result.ok) loadSchema(result.schema)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChange(value: string) {
    setText(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const requestId = ++latestRequestId.current
      parseDbml(value).then((result) => {
        if (requestId !== latestRequestId.current) return
        if (result.ok) {
          setErrors(null)
          loadSchema(result.schema)
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
