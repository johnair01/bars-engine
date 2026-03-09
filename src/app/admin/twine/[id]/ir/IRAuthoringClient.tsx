'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { saveIrDraft, publishIrToTwineStory, rollbackToVersion } from '@/actions/twine'
import { IRNodeEditor } from '@/components/admin/IRNodeEditor'
import { TwinePreviewModal } from '@/components/admin/TwinePreviewModal'
import { irToTwee, validateIrStory } from '@/lib/twine-authoring-ir'
import { parseTwee } from '@/lib/twee-parser'
import type { ParsedTwineStory } from '@/lib/twine-parser'
import type { IRNode, IRStoryMetadata } from '@/lib/twine-authoring-ir'

function parseIrDraft(irDraft: string | null): { nodes: IRNode[]; metadata: IRStoryMetadata } {
  if (!irDraft?.trim()) {
    return {
      nodes: [{ node_id: 'Start', type: 'informational', body: 'Welcome.' }],
      metadata: {},
    }
  }
  try {
    const raw = JSON.parse(irDraft) as { story_nodes?: IRNode[]; story_metadata?: IRStoryMetadata } | IRNode[]
    if (Array.isArray(raw)) {
      return { nodes: raw, metadata: {} }
    }
    return {
      nodes: raw.story_nodes ?? [],
      metadata: raw.story_metadata ?? {},
    }
  } catch {
    return {
      nodes: [{ node_id: 'Start', type: 'informational', body: 'Welcome.' }],
      metadata: {},
    }
  }
}

const DEFAULT_INFORMATIONAL: IRNode = {
  node_id: 'new_node',
  type: 'informational',
  body: '',
}

const DEFAULT_CHOICE_NODE: IRNode = {
  node_id: 'new_choice',
  type: 'choice_node',
  body: '',
  choices: [{ text: 'Option A', next_node: '' }, { text: 'Option B', next_node: '' }],
}

interface CompiledVersion {
  id: string
  createdAt: Date
  tweeContent: string
}

interface IRAuthoringClientProps {
  story: { id: string; title: string; irDraft: string | null }
  versions: CompiledVersion[]
}

export function IRAuthoringClient({ story, versions }: IRAuthoringClientProps) {
  const router = useRouter()
  const parsed = parseIrDraft(story.irDraft)
  const [nodes, setNodes] = useState<IRNode[]>(parsed.nodes.length ? parsed.nodes : [DEFAULT_INFORMATIONAL])
  const [metadata, setMetadata] = useState<IRStoryMetadata>(parsed.metadata)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(nodes[0]?.node_id ?? null)
  const [tweePreview, setTweePreview] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [compiling, setCompiling] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [rollingBack, setRollingBack] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewStory, setPreviewStory] = useState<ParsedTwineStory | null>(null)

  const allNodeIds = nodes.map((n) => n.node_id)
  const selectedNode = nodes.find((n) => n.node_id === selectedNodeId)

  const toIrDraft = useCallback(() => {
    return JSON.stringify({ story_metadata: metadata, story_nodes: nodes })
  }, [metadata, nodes])

  const handleSaveDraft = async () => {
    setSaving(true)
    const result = await saveIrDraft(story.id, toIrDraft())
    setSaving(false)
    if (result.error) {
      setValidationErrors([result.error])
    } else {
      setValidationErrors([])
      router.refresh()
    }
  }

  const handleCompile = async () => {
    setCompiling(true)
    setValidationErrors([])
    try {
      const res = await fetch('/api/admin/twee/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_nodes: nodes,
          story_metadata: { title: metadata.title ?? story.title, start_node: metadata.start_node ?? nodes[0]?.node_id },
        }),
      })
      const data = (await res.json()) as { errors?: string[]; twee_file?: string }
      if (data.errors?.length) {
        setValidationErrors(data.errors)
        setTweePreview(null)
      } else if (data.twee_file) {
        setTweePreview(data.twee_file)
        setValidationErrors([])
      }
    } catch (e) {
      setValidationErrors([e instanceof Error ? e.message : 'Compile failed'])
    }
    setCompiling(false)
  }

  const handlePublish = async () => {
    setPublishing(true)
    setValidationErrors([])
    const result = await publishIrToTwineStory(story.id, toIrDraft())
    setPublishing(false)
    if (result.error) {
      setValidationErrors([result.error])
    } else {
      setValidationErrors([])
      setTweePreview(null)
      router.refresh()
    }
  }

  const handlePreview = () => {
    try {
      const validation = validateIrStory(nodes)
      if (!validation.valid) {
        setValidationErrors(validation.errors)
        return
      }
      const title = metadata.title ?? story.title
      const startNode = metadata.start_node ?? nodes[0]?.node_id ?? 'Start'
      const twee = irToTwee(nodes, { title, startNode })
      const parsed = parseTwee(twee)
      setValidationErrors([])
      setPreviewStory(parsed)
      setPreviewOpen(true)
    } catch (err) {
      setValidationErrors([err instanceof Error ? err.message : 'Preview failed'])
    }
  }

  const handleRollback = async (versionId: string) => {
    setRollingBack(versionId)
    setValidationErrors([])
    const result = await rollbackToVersion(story.id, versionId)
    setRollingBack(null)
    if (result.error) {
      setValidationErrors([result.error])
    } else {
      router.refresh()
    }
  }

  const updateNode = (nodeId: string, updated: IRNode) => {
    setNodes((prev) =>
      prev.map((n) => (n.node_id === nodeId ? updated : n))
    )
    if (selectedNodeId === nodeId) setSelectedNodeId(updated.node_id)
  }

  const addNode = (template: 'informational' | 'choice_node') => {
    const base = template === 'informational' ? { ...DEFAULT_INFORMATIONAL } : { ...DEFAULT_CHOICE_NODE }
    const suffix = nodes.length
    base.node_id = `node_${suffix}`
    if (template === 'choice_node' && base.choices) {
      base.choices = base.choices.map((c, i) => ({ ...c, next_node: nodes[0]?.node_id ?? '' }))
    }
    setNodes((prev) => [...prev, base])
    setSelectedNodeId(base.node_id)
  }

  const deleteNode = (nodeId: string) => {
    if (nodes.length <= 1) return
    setNodes((prev) => prev.filter((n) => n.node_id !== nodeId))
    if (selectedNodeId === nodeId) {
      const remaining = nodes.filter((n) => n.node_id !== nodeId)
      setSelectedNodeId(remaining[0]?.node_id ?? null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Story metadata */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Story Metadata</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Title</label>
            <input
              className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm"
              value={metadata.title ?? story.title}
              onChange={(e) => setMetadata((m) => ({ ...m, title: e.target.value || undefined }))}
              placeholder={story.title}
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Start Node</label>
            <select
              className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm"
              value={metadata.start_node ?? ''}
              onChange={(e) => setMetadata((m) => ({ ...m, start_node: e.target.value || undefined }))}
            >
              <option value="">First node</option>
              {allNodeIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Story outline */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Story Outline</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addNode('informational')}
              className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
            >
              + Informational
            </button>
            <button
              type="button"
              onClick={() => addNode('choice_node')}
              className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300"
            >
              + Choice Node
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {nodes.map((n) => (
            <div
              key={n.node_id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition ${
                selectedNodeId === n.node_id
                  ? 'bg-green-900/20 border-green-700 text-green-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedNodeId(n.node_id)}
                className="text-left min-w-0"
              >
                <span className="text-xs font-mono truncate block">{n.node_id}</span>
                <span className="text-[10px] text-zinc-500">{n.type}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNode(n.node_id)
                }}
                disabled={nodes.length <= 1}
                className="text-red-400 hover:text-red-300 text-xs disabled:opacity-30"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Node editor */}
      {selectedNode && (
        <section>
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Edit Node</h2>
          <IRNodeEditor
            node={selectedNode}
            allNodeIds={allNodeIds}
            onChange={(updated) => updateNode(selectedNode.node_id, updated)}
          />
        </section>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
          <ul className="text-sm text-red-300 space-y-1">
            {validationErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePreview}
          className="px-4 py-2 bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 rounded-lg text-sm border border-purple-800"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={handleCompile}
          disabled={compiling}
          className="px-4 py-2 bg-blue-900/50 hover:bg-blue-800/50 text-blue-300 rounded-lg text-sm border border-blue-800 disabled:opacity-50"
        >
          {compiling ? 'Compiling…' : 'Compile'}
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing}
          className="px-4 py-2 bg-green-900/50 hover:bg-green-800/50 text-green-300 rounded-lg text-sm border border-green-800 disabled:opacity-50"
        >
          {publishing ? 'Publishing…' : 'Publish'}
        </button>
      </section>

      {/* Twee preview */}
      {tweePreview && (
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Compiled .twee</h2>
          <pre className="text-xs text-zinc-400 overflow-x-auto p-4 bg-black rounded-lg font-mono whitespace-pre-wrap">
            {tweePreview}
          </pre>
        </section>
      )}

      {previewStory && (
        <TwinePreviewModal
          story={previewStory}
          isOpen={previewOpen}
          onClose={() => {
            setPreviewOpen(false)
            setPreviewStory(null)
          }}
        />
      )}

      {/* Version history / Rollback */}
      {versions.length > 0 && (
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Version History</h2>
          <p className="text-xs text-zinc-500 mb-3">Restore a prior compiled version. This updates the live story; irDraft is unchanged.</p>
          <ul className="space-y-2">
            {versions.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-3 py-2 border-b border-zinc-800 last:border-0"
              >
                <span className="text-xs text-zinc-400">
                  {new Date(v.createdAt).toLocaleString()} · {v.tweeContent.length} chars
                </span>
                <button
                  type="button"
                  onClick={() => handleRollback(v.id)}
                  disabled={rollingBack !== null}
                  className="text-xs px-2 py-1 bg-amber-900/30 hover:bg-amber-800/30 text-amber-300 rounded border border-amber-800 disabled:opacity-50"
                >
                  {rollingBack === v.id ? 'Rolling back…' : 'Rollback'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
