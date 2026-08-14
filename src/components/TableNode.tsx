import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
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
  if (field.unique) badges.push('UQ')
  if (field.notNull) badges.push('NN')
  return badges
}

export function TableNode({ data }: NodeProps & { data: TableNodeData }) {
  return (
    <div className="min-w-56 rounded-md border bg-card text-card-foreground shadow-sm">
      <div className="rounded-t-md border-b bg-muted px-3 py-1.5 text-sm font-semibold">
        {data.name}
      </div>
      <div className="divide-y">
        {data.fields.map((field) => {
          const isFk = data.fkFieldIds.has(field.id)
          const badges = fieldBadges(field, isFk)
          return (
            <div
              key={field.id}
              className="relative flex items-center justify-between gap-3 px-3 py-1 text-xs"
            >
              <Handle
                type="source"
                position={Position.Right}
                id={field.id}
                className="!bg-muted-foreground"
              />
              <Handle
                type="target"
                position={Position.Left}
                id={field.id}
                className="!bg-muted-foreground"
              />
              <span className={cn('font-medium', field.pk && 'text-primary')}>
                {field.name}
              </span>
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
