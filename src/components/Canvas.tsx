import { useMemo } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useSchemaStore } from '@/store/schemaStore'
import { TableNode, type TableNodeData } from '@/components/TableNode'
import type { RefRelation } from '@/types/schema'

const nodeTypes = { table: TableNode }

const RELATION_LABEL: Record<RefRelation, string> = {
  '1-1': '1-1',
  '1-n': '1-n',
  'n-1': 'n-1',
  'n-n': 'n-n',
}

function CanvasInner() {
  const schema = useSchemaStore((s) => s.schema)

  const { nodes, edges } = useMemo(() => {
    const fkFieldIds = new Set(schema.refs.map((r) => r.fromFieldId))

    const nodes: Node<TableNodeData>[] = schema.tables.map((table) => ({
      id: table.id,
      type: 'table',
      position: table.position,
      data: { name: table.name, fields: table.fields, fkFieldIds },
    }))

    const edges: Edge[] = schema.refs.map((ref) => ({
      id: ref.id,
      source: ref.fromTableId,
      sourceHandle: ref.fromFieldId,
      target: ref.toTableId,
      targetHandle: ref.toFieldId,
      label: RELATION_LABEL[ref.relation],
    }))

    return { nodes, edges }
  }, [schema])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.1}
    >
      <Background />
      <Controls />
      <MiniMap pannable zoomable />
    </ReactFlow>
  )
}

export function Canvas() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center border-b px-3 text-xs font-medium text-muted-foreground">
        Diagram
      </div>
      <div className="flex-1">
        <ReactFlowProvider>
          <CanvasInner />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
