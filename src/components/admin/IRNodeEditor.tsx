'use client'

import type { IRNode, IRChoice, IRNodeType } from '@/lib/twine-authoring-ir'

interface IRNodeEditorProps {
  node: IRNode
  allNodeIds: string[]
  onChange: (node: IRNode) => void
}

const NODE_TYPES: IRNodeType[] = ['passage', 'choice_node', 'informational']

function bodyToString(body: string | string[]): string {
  if (Array.isArray(body)) return body.join('\n\n')
  return body ?? ''
}

function bodyToValue(body: string | string[]): string {
  return bodyToString(body)
}

export function IRNodeEditor({ node, allNodeIds, onChange }: IRNodeEditorProps) {
  const update = (partial: Partial<IRNode>) => {
    onChange({ ...node, ...partial })
  }

  const updateChoice = (index: number, partial: Partial<IRChoice>) => {
    const choices = [...(node.choices ?? [])]
    choices[index] = { ...choices[index], ...partial }
    update({ choices })
  }

  const addChoice = () => {
    const choices = [...(node.choices ?? []), { text: '', next_node: allNodeIds[0] ?? 'Start' }]
    update({ choices })
  }

  const removeChoice = (index: number) => {
    const choices = (node.choices ?? []).filter((_, i) => i !== index)
    update({ choices })
  }

  const emitsStr = (node.emits ?? []).join(', ')
  const setEmits = (s: string) => {
    const emits = s.split(',').map((e) => e.trim()).filter(Boolean)
    update({ emits: emits.length ? emits : undefined })
  }

  const hasChoices = node.type === 'choice_node' && (node.choices?.length ?? 0) > 0
  const showNextNode = !hasChoices && (node.type === 'passage' || node.type === 'informational')

  return (
    <div className="space-y-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
      <div>
        <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1 font-mono">Node ID</label>
        <input
          className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-green-500 transition outline-none"
          value={node.node_id}
          onChange={(e) => update({ node_id: e.target.value })}
          placeholder="e.g. intro_01"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1 font-mono">Type</label>
        <select
          className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-green-500 transition outline-none"
          value={node.type}
          onChange={(e) => update({ type: e.target.value as IRNodeType })}
        >
          {NODE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1 font-mono">Title (optional)</label>
        <input
          className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-green-500 transition outline-none"
          value={node.title ?? ''}
          onChange={(e) => update({ title: e.target.value || undefined })}
          placeholder="Passage title"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1 font-mono">Body</label>
        <textarea
          className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm h-32 focus:border-green-500 transition outline-none font-mono"
          value={bodyToValue(node.body)}
          onChange={(e) => update({ body: e.target.value })}
          placeholder="Story prose. Use blank lines for paragraphs."
        />
      </div>

      {node.type === 'choice_node' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Choices</label>
            <button
              type="button"
              onClick={addChoice}
              className="text-xs text-green-400 hover:text-green-300 transition"
            >
              + Add Choice
            </button>
          </div>
          <div className="space-y-2">
            {(node.choices ?? []).map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className="flex-1 bg-black border border-zinc-800 rounded p-2 text-sm text-white"
                  placeholder="Choice text"
                  value={c.text}
                  onChange={(e) => updateChoice(i, { text: e.target.value })}
                />
                <select
                  className="w-36 bg-black border border-zinc-800 rounded p-2 text-sm text-white"
                  value={c.next_node}
                  onChange={(e) => updateChoice(i, { next_node: e.target.value })}
                >
                  <option value="">—</option>
                  {allNodeIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeChoice(i)}
                  className="text-xs text-red-400 hover:text-red-300 px-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNextNode && (
        <div>
          <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1 font-mono">Next Node</label>
          <select
            className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-green-500 transition outline-none"
            value={node.next_node ?? ''}
            onChange={(e) => update({ next_node: e.target.value || undefined })}
          >
            <option value="">—</option>
            {allNodeIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-1 font-mono">Emits (comma-separated)</label>
        <input
          className="w-full bg-black border border-zinc-800 rounded-lg p-2 text-white text-sm focus:border-green-500 transition outline-none"
          value={emitsStr}
          onChange={(e) => setEmits(e.target.value)}
          placeholder="event_one, event_two"
        />
      </div>
    </div>
  )
}
