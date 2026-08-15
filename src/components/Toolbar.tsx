import { useStore } from 'zustand'
import { Download, Plus, Redo2, Undo2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { gridPosition } from '@/lib/layout'
import { useSchemaStore } from '@/store/schemaStore'
import { parseDbml } from '@/dbml/parse'
import { openDbmlFile } from '@/dbml/file'
import { exportCurrentSchema } from '@/lib/exportSchema'

export function Toolbar() {
  const addTable = useSchemaStore((s) => s.addTable)
  const addField = useSchemaStore((s) => s.addField)
  const loadSchema = useSchemaStore((s) => s.loadSchema)
  const tableCount = useSchemaStore((s) => s.schema.tables.length)
  const temporal = useStore(useSchemaStore.temporal)

  function handleAddTable() {
    const id = addTable({ position: gridPosition(tableCount) })
    addField(id, { name: 'id', type: 'int', pk: true })
  }

  async function handleImport() {
    if (tableCount > 0) {
      const confirmed = window.confirm(
        `Importing will replace your current schema (${tableCount} table${tableCount === 1 ? '' : 's'}). Continue?`,
      )
      if (!confirmed) return
    }

    const text = await openDbmlFile()
    if (text == null) return

    const result = await parseDbml(text)
    if (!result.ok) {
      window.alert(
        `Couldn't import this file:\n${result.errors.map((e) => `Line ${e.line}:${e.column} — ${e.message}`).join('\n')}`,
      )
      return
    }
    loadSchema(result.schema, 'import')
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <span className="text-sm font-medium">DB Designer</span>
      <div className="flex-1" />
      <Button
        size="sm"
        variant="outline"
        disabled={temporal.pastStates.length === 0}
        onClick={() => temporal.undo()}
        aria-label="Undo"
      >
        <Undo2 className="size-3.5" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={temporal.futureStates.length === 0}
        onClick={() => temporal.redo()}
        aria-label="Redo"
      >
        <Redo2 className="size-3.5" />
      </Button>
      <Button size="sm" variant="outline" onClick={handleImport}>
        <Upload className="size-3.5" />
        Import
      </Button>
      <Button size="sm" variant="outline" onClick={() => void exportCurrentSchema()}>
        <Download className="size-3.5" />
        Export
      </Button>
      <Button size="sm" variant="outline" onClick={handleAddTable}>
        <Plus className="size-3.5" />
        Add table
      </Button>
    </header>
  )
}
