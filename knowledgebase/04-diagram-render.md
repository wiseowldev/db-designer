# Step 4: Diagram Render (store → React Flow)

## Goal
The store's `Schema` renders as a live ERD on the canvas — this closes the first half of the loop (DBML → visible diagram).

## What to build
- Install `reactflow`/`@xyflow/react`.
- A custom node type (`TableNode`) that renders a table's name and its field list (name, type, PK/FK badges) as a styled shadcn-flavored card — this is most of the visual identity of the app, worth taking time on.
- A selector/derivation from the store: `schema.tables -> Node[]`, `schema.refs -> Edge[]` (React Flow node `id` = table `id`, position = `table.position`). Use a memoized selector so React Flow doesn't re-render every node on unrelated store changes.
- Edge styling that reads relationship cardinality (`1-1`, `1-n`, etc.) and renders it near the edge endpoints (crow's foot notation or simple labels — simple labels are fine for v1).
- Canvas chrome: `<Background />`, `<Controls />`, `<MiniMap />` from React Flow, fit-to-view on initial load and on import.

## Done when
- Importing DBML from step 3 shows a diagram with correctly positioned tables (even if just auto-cascaded), all fields listed, and edges connecting the right fields with correct direction.
- Dragging a table around the canvas doesn't yet need to persist (that's step 5) but shouldn't crash or fight React Flow's internal state.

## Status: implemented

`@xyflow/react` (React Flow's current package) is used. `src/components/TableNode.tsx` is the custom `table` node type: name + field rows with PK/FK/AI/UQ/NN badges (`fieldBadges`). `src/components/RelationEdge.tsx` is the custom `relation` edge type — cardinality renders as a plain text label (`1-1`/`1-n`/etc.), not crow's-foot notation (the plan called simple labels acceptable for v1).

`Canvas.tsx` derives nodes/edges from the store with `useMemo` (`schema.tables → Node[]`, `schema.refs → Edge[]`), then reconciles them into React Flow's own `useNodesState`/`useEdgesState` local state via an effect — local state is kept because React Flow needs smooth in-progress drag/selection state that the store doesn't track; the reconciliation preserves an in-progress drag's position and an edge's `selected` flag rather than clobbering them with the store-derived value. `Background`/`Controls`/`MiniMap` are present, plus `fitView` on mount and an empty-state hint overlay when there are no tables.
