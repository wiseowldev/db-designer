import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useSchemaStore } from '@/store/schemaStore'
import type { RefRelation } from '@/types/schema'

const RELATION_OPTIONS: RefRelation[] = ['1-1', '1-n', 'n-1', 'n-n']

export function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  selected,
}: EdgeProps) {
  const updateRef = useSchemaStore((s) => s.updateRef)
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={selected ? { stroke: 'var(--color-primary)', strokeWidth: 2 } : undefined}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          <Popover>
            <PopoverTrigger className="rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium shadow-sm hover:bg-accent">
              {String(label ?? '')}
            </PopoverTrigger>
            <PopoverContent className="w-32 p-1">
              {RELATION_OPTIONS.map((relation) => (
                <button
                  key={relation}
                  type="button"
                  className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-accent"
                  onClick={() => updateRef(id, { relation })}
                >
                  {relation}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
