import { useEffect, useMemo } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodeDrag,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useSchemaStore } from '@/store/schemaStore'
import { TableNode, type TableNodeData } from '@/components/TableNode'
import { RelationEdge } from '@/components/RelationEdge'
import type { RefRelation } from '@/types/schema'

const nodeTypes = { table: TableNode }
const edgeTypes = { relation: RelationEdge }

const RELATION_LABEL: Record<RefRelation, string> = {
  '1-1': '1-1',
  '1-n': '1-n',
  'n-1': 'n-1',
  'n-n': 'n-n',
}

function CanvasInner() {
  const schema = useSchemaStore((s) => s.schema)
  const setTablePosition = useSchemaStore((s) => s.setTablePosition)
  const addRef = useSchemaStore((s) => s.addRef)
  const removeRef = useSchemaStore((s) => s.removeRef)

  const storeNodes = useMemo(() => {
    const fkFieldIds = new Set(schema.refs.map((r) => r.fromFieldId))
    const nodes: Node<TableNodeData>[] = schema.tables.map((table) => ({
      id: table.id,
      type: 'table',
      position: table.position,
      data: { name: table.name, fields: table.fields, fkFieldIds },
    }))
    return nodes
  }, [schema])

  const storeEdges: Edge[] = useMemo(
    () =>
      schema.refs.map((ref) => ({
        id: ref.id,
        type: 'relation',
        source: ref.fromTableId,
        sourceHandle: ref.fromFieldId,
        target: ref.toTableId,
        targetHandle: ref.toFieldId,
        label: RELATION_LABEL[ref.relation],
      })),
    [schema.refs],
  )

  // Nodes live in local React Flow state so dragging stays smooth; this effect
  // reconciles that state with the store whenever tables/fields change
  // elsewhere (DBML edit, import), without clobbering an in-progress drag's
  // position with a stale store value.
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes)
  useEffect(() => {
    setNodes((current) => {
      const currentById = new Map(current.map((n) => [n.id, n]))
      return storeNodes.map((n) => {
        const existing = currentById.get(n.id)
        return existing ? { ...n, position: existing.position } : n
      })
    })
  }, [storeNodes, setNodes])

  // Same reconciliation pattern for edges, preserving local selection state
  // (the store has no concept of "selected") across store-driven changes.
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(storeEdges)
  useEffect(() => {
    setEdges((current) => {
      const currentById = new Map(current.map((e) => [e.id, e]))
      return storeEdges.map((e) => {
        const existing = currentById.get(e.id)
        return existing ? { ...e, selected: existing.selected } : e
      })
    })
  }, [storeEdges, setEdges])

  const handleNodeDragStop: OnNodeDrag<Node<TableNodeData>> = (_event, node) => {
    setTablePosition(node.id, node.position)
  }

  const handleConnect: OnConnect = (connection) => {
    const { source, sourceHandle, target, targetHandle } = connection
    if (!source || !target || !sourceHandle || !targetHandle) return
    if (source === target && sourceHandle === targetHandle) return
    addRef({
      fromTableId: source,
      fromFieldId: sourceHandle,
      toTableId: target,
      toFieldId: targetHandle,
      relation: 'n-1',
    })
  }

  const handleEdgesChange: OnEdgesChange = (changes) => {
    onEdgesChangeInternal(changes)
    for (const change of changes) {
      if (change.type === 'remove') removeRef(change.id)
    }
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={handleEdgesChange}
      onNodeDragStop={handleNodeDragStop}
      onConnect={handleConnect}
      deleteKeyCode={['Backspace', 'Delete']}
      fitView
      minZoom={0.1}
    >
      <Background />
      <Controls />
      <MiniMap pannable zoomable />
      {schema.tables.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="max-w-xs text-center text-sm text-muted-foreground">
            No tables yet. Paste DBML in the editor or click "Add table" to begin.
          </p>
        </div>
      )}
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
