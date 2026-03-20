'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  cmaStoryToTwee,
  validateQuestGraph,
  type CmaEdge,
  type CmaNode,
  type CmaNodeKind,
  type CmaStory,
} from '@/lib/modular-cyoa-graph'

const DEMO_STORY: CmaStory = {
  id: 'cma-blocks-demo',
  startId: 'intro',
  nodes: [
    { id: 'intro', kind: 'scene', title: 'Opening' },
    { id: 'pick', kind: 'choice', title: 'Choose a path' },
    { id: 'end_a', kind: 'end', title: 'End A' },
    { id: 'end_b', kind: 'end', title: 'End B' },
  ],
  edges: [
    { id: 'e1', from: 'intro', to: 'pick' },
    { id: 'e2', from: 'pick', to: 'end_a', label: 'Path A' },
    { id: 'e3', from: 'pick', to: 'end_b', label: 'Path B' },
  ],
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function BlockPalettePlayground() {
  const [story, setStory] = useState<CmaStory>(() => ({
    ...DEMO_STORY,
    nodes: DEMO_STORY.nodes.map((n) => ({ ...n })),
    edges: DEMO_STORY.edges.map((e) => ({ ...e })),
  }))

  const [edgeFrom, setEdgeFrom] = useState('')
  const [edgeTo, setEdgeTo] = useState('')
  const [edgeLabel, setEdgeLabel] = useState('')

  const validation = useMemo(() => validateQuestGraph(story), [story])
  const twee = useMemo(() => {
    if (!validation.ok) return ''
    try {
      return cmaStoryToTwee(story, { title: story.id ?? 'CMA Blocks' })
    } catch {
      return ''
    }
  }, [story, validation.ok])

  const updateNode = useCallback((id: string, patch: Partial<CmaNode>) => {
    setStory((s) => ({
      ...s,
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }))
  }, [])

  const removeNode = useCallback((id: string) => {
    setStory((s) => ({
      ...s,
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.from !== id && e.to !== id),
      startId: s.startId === id ? '' : s.startId,
    }))
  }, [])

  const addNode = useCallback((kind: CmaNodeKind) => {
    const id =
      kind === 'scene'
        ? newId('scene')
        : kind === 'choice'
          ? newId('choice')
          : newId('end')
    const title =
      kind === 'scene' ? 'New scene' : kind === 'choice' ? 'New choice' : 'Ending'
    setStory((s) => ({
      ...s,
      nodes: [...s.nodes, { id, kind, title }],
    }))
  }, [])

  const addEdge = useCallback(() => {
    if (!edgeFrom || !edgeTo || edgeFrom === edgeTo) return
    const id = newId('edge')
    const e: CmaEdge = { id, from: edgeFrom, to: edgeTo }
    if (edgeLabel.trim()) e.label = edgeLabel.trim()
    setStory((s) => ({ ...s, edges: [...s.edges, e] }))
    setEdgeLabel('')
  }, [edgeFrom, edgeTo, edgeLabel])

  const removeEdge = useCallback((id: string) => {
    setStory((s) => ({ ...s, edges: s.edges.filter((e) => e.id !== id) }))
  }, [])

  const copyTwee = useCallback(() => {
    if (twee) void navigator.clipboard.writeText(twee)
  }, [twee])

  const resetDemo = useCallback(() => {
    setStory({
      ...DEMO_STORY,
      nodes: DEMO_STORY.nodes.map((n) => ({ ...n })),
      edges: DEMO_STORY.edges.map((e) => ({ ...e })),
    })
  }, [])

  const nodeIds = story.nodes.map((n) => n.id)

  return (
    <div className="space-y-6 text-zinc-200">
      <div className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-4 space-y-3">
        <h2 className="text-lg font-semibold text-white">CMA block palette (MVP)</h2>
        <p className="text-sm text-zinc-400">
          Build a minimal quest graph (scene / choice / end), validate with the same rules as strand
          falsification, then preview SugarCube Twee.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addNode('scene')}
            className="rounded-md bg-emerald-700/80 px-3 py-1.5 text-sm hover:bg-emerald-600"
          >
            + Scene
          </button>
          <button
            type="button"
            onClick={() => addNode('choice')}
            className="rounded-md bg-amber-700/80 px-3 py-1.5 text-sm hover:bg-amber-600"
          >
            + Choice
          </button>
          <button
            type="button"
            onClick={() => addNode('end')}
            className="rounded-md bg-zinc-600 px-3 py-1.5 text-sm hover:bg-zinc-500"
          >
            + End
          </button>
          <button
            type="button"
            onClick={resetDemo}
            className="rounded-md border border-zinc-600 px-3 py-1.5 text-sm hover:bg-zinc-800"
          >
            Reset demo
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Start node</label>
            <select
              value={story.startId}
              onChange={(e) => setStory((s) => ({ ...s, startId: e.target.value }))}
              className="w-full rounded-md border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm"
            >
              <option value="">— none —</option>
              {nodeIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white mb-2">Nodes</h3>
            <ul className="space-y-2">
              {story.nodes.map((n) => (
                <li
                  key={n.id}
                  className="flex flex-wrap items-center gap-2 rounded border border-zinc-700 bg-zinc-950 p-2"
                >
                  <span className="text-xs uppercase text-zinc-500 w-16 shrink-0">{n.kind}</span>
                  <input
                    value={n.id}
                    readOnly
                    className="flex-1 min-w-[6rem] rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-400"
                  />
                  <input
                    value={n.title ?? ''}
                    onChange={(e) => updateNode(n.id, { title: e.target.value })}
                    placeholder="Title"
                    className="flex-[2] rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeNode(n.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white mb-2">Edges</h3>
            <div className="flex flex-wrap gap-2 items-end mb-2">
              <div>
                <label className="block text-xs text-zinc-500">From</label>
                <select
                  value={edgeFrom}
                  onChange={(e) => setEdgeFrom(e.target.value)}
                  className="rounded-md border border-zinc-600 bg-zinc-950 px-2 py-1 text-sm min-w-[8rem]"
                >
                  <option value="">—</option>
                  {nodeIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500">To</label>
                <select
                  value={edgeTo}
                  onChange={(e) => setEdgeTo(e.target.value)}
                  className="rounded-md border border-zinc-600 bg-zinc-950 px-2 py-1 text-sm min-w-[8rem]"
                >
                  <option value="">—</option>
                  {nodeIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500">Label (optional)</label>
                <input
                  value={edgeLabel}
                  onChange={(e) => setEdgeLabel(e.target.value)}
                  className="rounded-md border border-zinc-600 bg-zinc-950 px-2 py-1 text-sm w-32"
                />
              </div>
              <button
                type="button"
                onClick={addEdge}
                className="rounded-md bg-purple-700 px-3 py-1.5 text-sm hover:bg-purple-600"
              >
                Add edge
              </button>
            </div>
            <ul className="space-y-1 text-sm">
              {story.edges.map((e) => (
                <li
                  key={e.id}
                  className="flex justify-between gap-2 rounded bg-zinc-900/80 px-2 py-1 font-mono text-xs"
                >
                  <span>
                    {e.from} → {e.to}
                    {e.label ? ` (“${e.label}”)` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEdge(e.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-white mb-2">Validation (Diplomat-facing)</h3>
            {validation.ok ? (
              <p className="text-sm text-emerald-400">Graph passes structural checks.</p>
            ) : (
              <ul className="space-y-2 text-sm text-amber-200/90 list-disc list-inside">
                {validation.errors.map((err, i) => (
                  <li key={i}>{err.message}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white">Twee preview</h3>
              <button
                type="button"
                disabled={!twee}
                onClick={copyTwee}
                className="rounded border border-zinc-600 px-2 py-1 text-xs hover:bg-zinc-800 disabled:opacity-40"
              >
                Copy .twee
              </button>
            </div>
            <textarea
              readOnly
              value={twee || (validation.ok ? '' : 'Fix validation errors to generate Twee.')}
              className="w-full h-[min(28rem,50vh)] rounded-md border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs text-zinc-300"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
