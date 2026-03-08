'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { FlowOutput, FlowNode } from '@/lib/twee-to-flow/types'
import { PassageEditModal } from './PassageEditModal'

type GraphItem =
  | { kind: 'linear'; node: FlowNode }
  | { kind: 'choice'; parent: FlowNode; branches: { label: string; node: FlowNode }[]; convergence: FlowNode }

function buildFlowGraph(flow: FlowOutput): GraphItem[] {
  const nodeMap = new Map(flow.nodes.map((n) => [n.id, n]))
  const items: GraphItem[] = []
  const visited = new Set<string>()
  let currentId: string | null = flow.start_node_id

  while (currentId && !visited.has(currentId)) {
    const node = nodeMap.get(currentId)
    if (!node) break

    if (node.actions.length > 1) {
      const branches = node.actions
        .map((a) => ({ label: a.label ?? '', node: nodeMap.get(a.next_node_id!) }))
        .filter((b): b is { label: string; node: FlowNode } => !!b.node)
      const convergenceId = node.actions[0]?.next_node_id
      const convergence = convergenceId ? nodeMap.get(convergenceId) : null

      if (convergence) {
        items.push({ kind: 'choice', parent: node, branches, convergence })
        visited.add(currentId)
        branches.forEach((b) => visited.add(b.node.id))
        visited.add(convergence.id)
        const nextAction = convergence.actions[0]
        currentId = nextAction?.next_node_id ?? null
      } else {
        items.push({ kind: 'linear', node })
        visited.add(currentId)
        currentId = node.actions[0]?.next_node_id ?? null
      }
    } else {
      items.push({ kind: 'linear', node })
      visited.add(currentId)
      currentId = node.actions[0]?.next_node_id ?? null
    }
  }

  return items
}

function NodeRow({
  node,
  indent = false,
  onClick,
}: {
  node: FlowNode
  indent?: boolean
  onClick?: () => void
}) {
  return (
    <div
      className={`relative pl-10 ${indent ? 'pl-6' : ''} ${onClick ? 'cursor-pointer hover:bg-zinc-800/50 -mx-2 px-2 py-1 rounded-lg transition' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="absolute left-2.5 top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-500 border-4 border-zinc-950" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-white font-bold truncate">{node.id}</h4>
          <span className="text-[10px] px-2 py-0.5 bg-emerald-900/30 text-emerald-400 font-bold rounded-md">
            {node.type.toUpperCase()}
          </span>
        </div>
        <p className="text-zinc-500 text-xs mt-1 line-clamp-1">{node.copy}</p>
        {node.actions[0]?.label && node.actions.length === 1 && (
          <p className="text-zinc-600 text-[10px] mt-0.5">→ {node.actions[0].label}</p>
        )}
      </div>
    </div>
  )
}

function fetchFlow(): Promise<FlowOutput | null> {
  return fetch('/api/admin/onboarding/flow?campaign=bruised-banana')
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })
}

export function OnboardingFlowTemplate() {
  const [flow, setFlow] = useState<FlowOutput | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editPassageId, setEditPassageId] = useState<string | null>(null)

  const loadFlow = () => {
    fetchFlow()
      .then((data) => {
        setFlow(data)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load template structure')
        setFlow(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    loadFlow()
  }, [])

  if (loading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
        <p className="text-zinc-500 italic">Loading template structure...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (!flow) return null

  const graphItems = buildFlowGraph(flow)

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-zinc-800 bg-zinc-800/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-zinc-400 text-sm">Reflects the onboarding draft. DB-driven threads below.</p>
        <div className="flex items-center gap-3">
          <Link
            href="/campaign/twine"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
          >
            Play draft
          </Link>
          <a
            href="/api/admin/onboarding/flow?campaign=bruised-banana"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
          >
            View API
          </a>
        </div>
      </div>
      <div className="p-6">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-800" />
          <div className="space-y-8">
            {graphItems.map((item, idx) => {
              if (item.kind === 'linear') {
                return (
                  <div key={item.node.id}>
                    <NodeRow
                      node={item.node}
                      onClick={() => setEditPassageId(item.node.id)}
                    />
                  </div>
                )
              }
              return (
                <div key={item.parent.id} className="space-y-4">
                  <NodeRow
                    node={item.parent}
                    onClick={() => setEditPassageId(item.parent.id)}
                  />
                  <div className="border-l-2 border-zinc-700/50 ml-4 pl-6 space-y-4">
                    {item.branches.map((b) => (
                      <div key={b.node.id}>
                        <p className="text-zinc-500 text-[10px] mb-1 line-clamp-1">↳ {b.label}</p>
                        <NodeRow
                          node={b.node}
                          indent
                          onClick={() => setEditPassageId(b.node.id)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="pt-2">
                    <p className="text-zinc-600 text-[10px] mb-1">→ converges to</p>
                    <NodeRow
                      node={item.convergence}
                      onClick={() => setEditPassageId(item.convergence.id)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <PassageEditModal
        isOpen={!!editPassageId}
        onClose={() => setEditPassageId(null)}
        passageId={editPassageId}
        onSaved={loadFlow}
      />
    </div>
  )
}
