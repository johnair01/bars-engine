'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { StoryMapData } from '@/actions/story-map'

/** Simple layout: BFS from start, assign levels, then position. */
function layoutNodes(
  nodes: StoryMapData['nodes'],
  edges: StoryMapData['edges'],
  startNodeId: string
): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>()
  const outEdges = new Map<string, string[]>()
  for (const e of edges) {
    const arr = outEdges.get(e.source) ?? []
    arr.push(e.target)
    outEdges.set(e.source, arr)
  }

  const level = new Map<string, number>()
  const queue: string[] = [startNodeId]
  level.set(startNodeId, 0)
  let head = 0
  while (head < queue.length) {
    const u = queue[head++]
    const l = level.get(u) ?? 0
    for (const v of outEdges.get(u) ?? []) {
      if (!level.has(v)) {
        level.set(v, l + 1)
        queue.push(v)
      }
    }
  }

  const byLevel = new Map<number, string[]>()
  for (const n of nodes) {
    const l = level.get(n.nodeId) ?? 0
    const arr = byLevel.get(l) ?? []
    arr.push(n.nodeId)
    byLevel.set(l, arr)
  }

  const nodeWidth = 180
  const nodeHeight = 60
  const gapX = 40
  const gapY = 80

  for (const [l, ids] of byLevel) {
    const rowWidth = ids.length * nodeWidth + (ids.length - 1) * gapX
    const startX = -rowWidth / 2 + nodeWidth / 2
    for (let i = 0; i < ids.length; i++) {
      pos.set(ids[i], {
        x: startX + i * (nodeWidth + gapX),
        y: l * (nodeHeight + gapY),
      })
    }
  }

  return pos
}

export function StoryMapClient({ data, adventureId }: { data: StoryMapData; adventureId: string }) {
  const router = useRouter()
  const positions = useMemo(
    () => layoutNodes(data.nodes, data.edges, data.startNodeId),
    [data.nodes, data.edges, data.startNodeId]
  )

  const initialNodes: Node[] = useMemo(
    () =>
      data.nodes.map((n) => {
        const { x, y } = positions.get(n.nodeId) ?? { x: 0, y: 0 }
        const parts: string[] = []
        if (n.isStart) parts.push('Start')
        if (n.isCurrent) parts.push('You')
        const badgeStr = parts.join(' · ')
        const label = badgeStr ? `${n.nodeId} (${badgeStr})\n${n.text}` : `${n.nodeId}\n${n.text}`
        return {
          id: n.nodeId,
          type: 'default',
          position: { x, y },
          data: { label },
          className: n.isCurrent
            ? '!bg-purple-900/30 !border-purple-500/60 !border-2'
            : n.isStart
              ? '!bg-green-900/20 !border-green-600/60'
              : '!bg-zinc-900 !border-zinc-700',
        }
      }),
    [data.nodes, data.startNodeId, positions]
  )

  const initialEdges: Edge[] = useMemo(
    () =>
      data.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        markerEnd: { type: MarkerType.ArrowClosed },
        className: 'stroke-zinc-600',
      })),
    [data.edges]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      router.push(`/adventure/${adventureId}/play?questId=&threadId=`)
    },
    [adventureId, router]
  )

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#27272a" gap={16} />
        <Controls className="!bg-zinc-900 !border-zinc-700 !rounded" />
        <MiniMap
          className="!bg-zinc-900 !border-zinc-700"
          nodeColor={(n) => (n.className?.includes('purple') ? '#a855f7' : n.className?.includes('green') ? '#22c55e' : '#52525b')}
        />
      </ReactFlow>
    </div>
  )
}
