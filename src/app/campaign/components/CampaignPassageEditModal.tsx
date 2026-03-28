'use client'

import { useState, useEffect } from 'react'
import { getCampaignPassageForEdit, listCampaignPassageNodeIds, upsertCampaignPassage } from '@/actions/campaign-passage'
import { CampaignBranchChoicesEditor } from '@/components/onboarding-cyoa-builder/CampaignBranchChoicesEditor'

interface CampaignChoice {
  text: string
  targetId: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  nodeId: string
  adventureSlug: string
  initialText?: string
  initialChoices?: CampaignChoice[]
  onSaved: () => void
}

export function CampaignPassageEditModal({
  isOpen,
  onClose,
  nodeId,
  adventureSlug,
  initialText = '',
  initialChoices = [],
  onSaved,
}: Props) {
  const [text, setText] = useState(initialText)
  const [choices, setChoices] = useState<CampaignChoice[]>(initialChoices)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [targetSuggestions, setTargetSuggestions] = useState<string[]>([])
  const datalistId = `cyoa-targets-${adventureSlug.replace(/[^a-zA-Z0-9_-]/g, '-')}`

  useEffect(() => {
    if (!isOpen || !adventureSlug) return
    const current = nodeId?.trim() ?? ''
    listCampaignPassageNodeIds(adventureSlug).then((r) => {
      const base = 'nodeIds' in r ? r.nodeIds : []
      const extra = ['signup', 'Game_Login']
      const merged =
        current && !base.includes(current) ? [...base, current] : [...base]
      setTargetSuggestions([...new Set([...merged, ...extra])].sort())
    })
  }, [isOpen, adventureSlug, nodeId])

  useEffect(() => {
    if (isOpen && adventureSlug && nodeId) {
      setFetching(true)
      setError(null)
      getCampaignPassageForEdit(adventureSlug, nodeId)
        .then((result) => {
          if (result) {
            setText(result.text)
            setChoices(result.choices.length > 0 ? result.choices : [{ text: '', targetId: '' }])
          } else {
            setText(initialText)
            setChoices(
              initialChoices.length > 0 ? initialChoices : [{ text: '', targetId: '' }]
            )
          }
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : 'Failed to load')
        })
        .finally(() => setFetching(false))
    }
  }, [isOpen, adventureSlug, nodeId, initialText, initialChoices])

  const addChoice = () => {
    setChoices([...choices, { text: '', targetId: '' }])
  }

  const removeChoice = (i: number) => {
    if (choices.length <= 1) return
    setChoices(choices.filter((_, idx) => idx !== i))
  }

  const updateChoice = (i: number, field: 'text' | 'targetId', value: string) => {
    const next = [...choices]
    next[i] = { ...next[i], [field]: value }
    setChoices(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const validChoices = choices.filter((c) => c.text.trim() && c.targetId.trim())
    const result = await upsertCampaignPassage(adventureSlug, nodeId, {
      text: text.trim(),
      choices: validChoices,
    })
    setLoading(false)
    if (result.success) {
      onSaved()
      onClose()
    } else {
      setError(result.error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Edit passage</h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Node: <code className="font-mono">{nodeId}</code>. Use <code className="font-mono">---</code> on its own
            line to force slide breaks.
          </p>

          {fetching ? (
            <div className="text-zinc-500 animate-pulse py-8">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <datalist id={datalistId}>
                {targetSuggestions.map((id) => (
                  <option key={id} value={id} />
                ))}
              </datalist>
              {error && (
                <div className="p-3 bg-red-900/20 text-red-300 text-sm rounded-lg whitespace-pre-wrap">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
                  Passage text (Markdown + macros)
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={10}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 font-mono text-sm"
                  placeholder="Type your story here..."
                />
              </div>

              <CampaignBranchChoicesEditor
                choices={choices}
                datalistId={datalistId}
                onAdd={addChoice}
                onRemove={removeChoice}
                onUpdate={updateChoice}
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition disabled:opacity-50 text-sm"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
