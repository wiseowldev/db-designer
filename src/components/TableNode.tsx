import { useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { FieldEditor } from '@/components/FieldEditor'
import { useSchemaStore } from '@/store/schemaStore'
import type { Field } from '@/types/schema'

export type TableNodeData = {
  name: string
  fields: Field[]
  fkFieldIds: Set<string>
}

function fieldBadges(field: Field, isFk: boolean) {
  const badges: string[] = []
  if (field.pk) badges.push('PK')
  if (isFk) badges.push('FK')
  if (field.increment) badges.push('AI')
  if (field.unique) badges.push('UQ')
  if (field.notNull) badges.push('NN')
  return badges
}

function TableName({ id, name }: { id: string; name: string }) {
  const updateTable = useSchemaStore((s) => s.updateTable)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)

  if (editing) {
    return (
      <Input
        autoFocus
        className="nodrag h-6 px-1 text-sm font-semibold"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          setEditing(false)
          if (value.trim() && value.trim() !== name) updateTable(id, { name: value.trim() })
          else setValue(name)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setValue(name)
            setEditing(false)
          }
        }}
      />
    )
  }

  return (
    <button
      type="button"
      className="nodrag flex-1 truncate text-left text-sm font-semibold"
      onClick={() => {
        setValue(name)
        setEditing(true)
      }}
    >
      {name}
    </button>
  )
}

function DeleteTableButton({ id, name }: { id: string; name: string }) {
  const removeTable = useSchemaStore((s) => s.removeTable)
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete table "{name}"?</DialogTitle>
          <DialogDescription>
            This also deletes any relationships connected to it. This can't be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={() => removeTable(id)}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
      <button
        type="button"
        className="nodrag text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(true)}
        aria-label={`Delete table ${name}`}
      >
        <Trash2 className="size-3.5" />
      </button>
    </Dialog>
  )
}

function FieldRow({ tableId, field, isFk }: { tableId: string; field: Field; isFk: boolean }) {
  const updateField = useSchemaStore((s) => s.updateField)
  const removeField = useSchemaStore((s) => s.removeField)
  const badges = fieldBadges(field, isFk)

  return (
    <div className="relative flex items-center justify-between gap-3 px-3 py-1 text-xs">
      <Handle type="source" position={Position.Right} id={field.id} className="!bg-muted-foreground" />
      <Handle type="target" position={Position.Left} id={field.id} className="!bg-muted-foreground" />
      <Popover>
        <PopoverTrigger className="nodrag flex flex-1 items-center justify-between gap-3 text-left">
          <span className={cn('font-medium', field.pk && 'text-primary')}>{field.name}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <span>{field.type}</span>
            {badges.map((b) => (
              <span
                key={b}
                className="rounded bg-secondary px-1 py-0.5 text-[10px] font-semibold text-secondary-foreground"
              >
                {b}
              </span>
            ))}
          </span>
        </PopoverTrigger>
        <FieldEditor
          field={field}
          onChange={(patch) => updateField(tableId, field.id, patch)}
          onRemove={() => removeField(tableId, field.id)}
        />
      </Popover>
    </div>
  )
}

export function TableNode({ id, data }: NodeProps & { data: TableNodeData }) {
  const addField = useSchemaStore((s) => s.addField)
  const fields = data.fields

  return (
    <div className="min-w-56 rounded-md border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-2 rounded-t-md border-b bg-muted px-3 py-1.5">
        <TableName id={id} name={data.name} />
        <DeleteTableButton id={id} name={data.name} />
      </div>
      <div className="divide-y">
        {fields.map((field) => (
          <FieldRow key={field.id} tableId={id} field={field} isFk={data.fkFieldIds.has(field.id)} />
        ))}
      </div>
      <button
        type="button"
        className="nodrag flex w-full items-center justify-center gap-1 rounded-b-md border-t px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        onClick={() => addField(id)}
      >
        <Plus className="size-3" />
        Add field
      </button>
    </div>
  )
}
