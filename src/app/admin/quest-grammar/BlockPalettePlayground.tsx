'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CMA_KIND_LABELS,
  cmaKindsForAdminPalette,
  cmaStoryToTwee,
  suggestBlocksFromCharge,
  validateQuestGraph,
  type CmaEdge,
  type CmaNode,
  type CmaNodeKind,
  type CmaStory,
  type ChargeLike,
} from '@/lib/modular-cyoa-graph'
import {
  deleteCmaTemplate,
  getCmaTemplate,
  isFullCmaPaletteUnlocked,
  listCmaTemplates,
  saveCmaTemplate,
  setFullCmaPaletteUnlocked,
} from './cmaClientStorage'

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

const DEFAULT_NODE_TITLE: Record<CmaNodeKind, string> = {
  scene: 'New scene',
  choice: 'New choice',
  metabolize: 'Metabolize beat',
  commit: 'Commit beat',
  branch_guard: 'Branch guard',
  merge: 'Merge',
  end: 'Ending',
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

function deepCloneStory(s: CmaStory): CmaStory {
  return {
    ...s,
    nodes: s.nodes.map((n) => ({ ...n })),
    edges: s.edges.map((e) => ({ ...e })),
    fragments: s.fragments?.map((f) => ({
      ...f,
      nodes: f.nodes.map((n) => ({ ...n })),
      edges: f.edges.map((e) => ({ ...e })),
    })),
  }
}

export function BlockPalettePlayground() {
  const [story, setStory] = useState<CmaStory>(() => deepCloneStory(DEMO_STORY))
  const [edgeFrom, setEdgeFrom] = useState('')
  const [edgeTo, setEdgeTo] = useState('')
  const [edgeLabel, setEdgeLabel] = useState('')
  const [fullPalette, setFullPalette] = useState(false)
  const [templateListVersion, setTemplateListVersion] = useState(0)
  const [templateName, setTemplateName] = useState('')
  const [provBarId, setProvBarId] = useState('')
  const [provQuestId, setProvQuestId] = useState('')
  const [provNote, setProvNote] = useState('')
  const [chargeJson, setChargeJson] = useState('')
  const [chargeHints, setChargeHints] = useState<string[]>([])
  const [structureOnly, setStructureOnly] = useState(true)

  useEffect(() => {
    setFullPalette(isFullCmaPaletteUnlocked())
  }, [])

  const unlockedKinds = useMemo(() => cmaKindsForAdminPalette(fullPalette), [fullPalette])

  const templates = useMemo(() => listCmaTemplates(), [templateListVersion])

  const validation = useMemo(() => validateQuestGraph(story), [story])
  const twee = useMemo(() => {
    if (!validation.ok) return ''
    try {
      return cmaStoryToTwee(story, { title: story.id ?? 'CMA Blocks' })
    } catch {
      return ''
    }
  }, [story, validation.ok])

  const toggleFullPalette = useCallback(() => {
    const next = !fullPalette
    setFullCmaPaletteUnlocked(next)
    setFullPalette(next)
  }, [fullPalette])

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
    const id = newId(kind)
    setStory((s) => ({
      ...s,
      nodes: [...s.nodes, { id, kind, title: DEFAULT_NODE_TITLE[kind] }],
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
    setStory(deepCloneStory(DEMO_STORY))
  }, [])

  const saveTemplate = useCallback(() => {
    const name = templateName.trim() || `Template ${new Date().toLocaleString()}`
    const provenance =
      provBarId.trim() || provQuestId.trim() || provNote.trim()
        ? {
            sourceBarId: provBarId.trim() || undefined,
            sourceQuestId: provQuestId.trim() || undefined,
            note: provNote.trim() || undefined,
          }
        : undefined
    saveCmaTemplate({
      name,
      story: deepCloneStory(story),
      provenance,
    })
    setTemplateName('')
    setTemplateListVersion((v) => v + 1)
  }, [story, templateName, provBarId, provQuestId, provNote])

  const loadTemplate = useCallback((id: string) => {
    const t = getCmaTemplate(id)
    if (t) setStory(deepCloneStory(t.story))
  }, [])

  const removeTemplate = useCallback((id: string) => {
    deleteCmaTemplate(id)
    setTemplateListVersion((v) => v + 1)
  }, [])

  const runChargeSuggest = useCallback(() => {
    let charge: ChargeLike = {}
    const raw = chargeJson.trim()
    if (raw) {
      try {
        charge = JSON.parse(raw) as ChargeLike
      } catch {
        charge = { description: raw }
      }
    }
    const s = suggestBlocksFromCharge(charge, { unlockedKinds })
    setChargeHints(s.hints)
  }, [chargeJson, unlockedKinds])

  const nodeIds = story.nodes.map((n) => n.id)

  const kindButtonClass = (kind: CmaNodeKind): string => {
    if (kind === 'scene') return 'bg-emerald-700/80 hover:bg-emerald-600'
    if (kind === 'choice') return 'bg-amber-700/80 hover:bg-amber-600'
    if (kind === 'end') return 'bg-zinc-600 hover:bg-zinc-500'
    return 'bg-indigo-700/70 hover:bg-indigo-600'
  }

  return (
    <div className="space-y-6 text-zinc-200">
      <details className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4">
        <summary className="cursor-pointer text-sm font-medium text-white">
          How this playground works (tutorial)
        </summary>
        <ol className="mt-3 list-decimal list-inside space-y-2 text-sm text-zinc-400">
          <li>
            Pick a <strong className="text-zinc-300">start</strong> node — that passage becomes Twee
            &quot;start&quot; in StoryData.
          </li>
          <li>
            <strong className="text-zinc-300">Choice</strong> nodes need at least two outgoing edges
            (validator catches single-arm choices).
          </li>
          <li>
            Every <strong className="text-zinc-300">end</strong> must be reachable from the start.
          </li>
          <li>
            Green validation → Twee preview uses{' '}
            <strong className="text-zinc-300">CMA → Twine IR → irToTwee</strong> (canonical compile path).
          </li>
          <li>
            Templates save to <strong className="text-zinc-300">this browser only</strong> (localStorage)
            with optional BAR / quest ids for provenance.
          </li>
        </ol>
      </details>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">CMA block palette</h2>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={structureOnly}
              onChange={(e) => setStructureOnly(e.target.checked)}
            />
            Structure-only mode (no AI fill required)
          </label>
        </div>
        <p className="text-sm text-zinc-400">
          Build a quest graph, validate (strand falsification rules), export SugarCube Twee. Turn on{' '}
          <strong>all block types</strong> for the full ADR archetype set. Charge suggestions are hints only —
          they never auto-edit your graph.
        </p>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={fullPalette} onChange={toggleFullPalette} id="cma-full-palette" />
          Unlock all CMA archetypes (metabolize, commit, branch guard, merge)
        </label>
        <div className="flex flex-wrap gap-2">
          {unlockedKinds.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => addNode(kind)}
              className={`rounded-md px-3 py-1.5 text-sm text-white ${kindButtonClass(kind)}`}
            >
              + {CMA_KIND_LABELS[kind]}
            </button>
          ))}
          <button
            type="button"
            onClick={resetDemo}
            className="rounded-md border border-zinc-600 px-3 py-1.5 text-sm hover:bg-zinc-800"
          >
            Reset demo
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/40 p-4 space-y-3">
          <h3 className="text-sm font-medium text-white">Template library (browser)</h3>
          <p className="text-xs text-zinc-500">
            Persisted in localStorage with optional provenance. Replace with DB when you need
            cross-device templates.
          </p>
          <div className="flex flex-wrap gap-2 items-end">
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
              className="rounded border border-zinc-600 bg-zinc-950 px-2 py-1 text-sm flex-1 min-w-[8rem]"
            />
            <button
              type="button"
              onClick={saveTemplate}
              className="rounded-md bg-sky-800 px-3 py-1.5 text-sm hover:bg-sky-700"
            >
              Save current graph
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 text-xs">
            <input
              value={provBarId}
              onChange={(e) => setProvBarId(e.target.value)}
              placeholder="Source BAR id (optional)"
              className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1"
            />
            <input
              value={provQuestId}
              onChange={(e) => setProvQuestId(e.target.value)}
              placeholder="Source quest id (optional)"
              className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1"
            />
            <input
              value={provNote}
              onChange={(e) => setProvNote(e.target.value)}
              placeholder="Note (optional)"
              className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1"
            />
          </div>
          {templates.length > 0 ? (
            <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">
              {templates.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded bg-zinc-950/80 px-2 py-1"
                >
                  <span className="truncate" title={t.id}>
                    {t.name}{' '}
                    <span className="text-zinc-500 text-xs">
                      {t.provenance?.sourceBarId ? `· bar:${t.provenance.sourceBarId.slice(0, 8)}…` : ''}
                    </span>
                  </span>
                  <span className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => loadTemplate(t.id)}
                      className="text-sky-400 hover:text-sky-300 text-xs"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTemplate(t.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Delete
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-600">No saved templates yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-zinc-700 bg-zinc-900/40 p-4 space-y-3">
          <h3 className="text-sm font-medium text-white">Charge → block hints</h3>
          <p className="text-xs text-zinc-500">
            Paste JSON <code className="text-zinc-400">{'{ title, description, frictionNote, moveType }'}</code>{' '}
            or plain text (used as description). Non-mandatory Guidance only.
          </p>
          <textarea
            value={chargeJson}
            onChange={(e) => setChargeJson(e.target.value)}
            placeholder='{"title":"…","description":"…","moveType":"growUp"}'
            className="w-full h-24 rounded border border-zinc-600 bg-zinc-950 p-2 text-xs font-mono"
          />
          <button
            type="button"
            onClick={runChargeSuggest}
            className="rounded-md border border-zinc-600 px-3 py-1.5 text-sm hover:bg-zinc-800"
          >
            Suggest from charge
          </button>
          {chargeHints.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-amber-100/90 space-y-1">
              {chargeHints.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          ) : null}
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
                  <span className="text-xs uppercase text-zinc-500 w-24 shrink-0">{n.kind}</span>
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
