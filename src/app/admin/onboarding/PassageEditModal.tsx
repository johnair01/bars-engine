'use client'

import { useState, useEffect } from 'react'

type Passage = {
  id: string
  name: string
  tags: string[]
  body: string
  links: { label: string; target: string }[]
}

type Props = {
  isOpen: boolean
  onClose: () => void
  passageId: string | null
  onSaved?: () => void
}

export function PassageEditModal({ isOpen, onClose, passageId, onSaved }: Props) {
  const [passages, setPassages] = useState<Passage[]>([])
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [links, setLinks] = useState<{ label: string; target: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && passageId) {
      setFetching(true)
      setError(null)
      fetch('/api/admin/onboarding/draft/passages')
        .then((res) => {
          if (!res.ok) throw new Error(res.statusText)
          return res.json()
        })
        .then((data) => {
          setPassages(data.passages ?? [])
          const p = (data.passages as Passage[]).find((x) => x.id === passageId)
          if (p) {
            setName(p.name)
            setBody(p.body)
            setLinks(p.links.length > 0 ? p.links : [{ label: '', target: '' }])
          } else {
            setError(`Passage not found: ${passageId}`)
          }
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : 'Failed to load passages')
        })
        .finally(() => setFetching(false))
    }
  }, [isOpen, passageId])

  const addLink = () => {
    setLinks([...links, { label: '', target: '' }])
  }

  const removeLink = (i: number) => {
    if (links.length <= 1) return
    setLinks(links.filter((_, idx) => idx !== i))
  }

  const updateLink = (i: number, field: 'label' | 'target', value: string) => {
    const next = [...links]
    next[i] = { ...next[i], [field]: value }
    setLinks(next)
  }

  const passageNames = passages.map((p) => p.name)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passageId) return
    setLoading(true)
    setError(null)
    const validLinks = links.filter((l) => l.label.trim() && l.target.trim())
    const res = await fetch(`/api/admin/onboarding/draft/passages/${encodeURIComponent(passageId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), body: body.trim(), links: validLinks }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (res.ok && data.success) {
      onSaved?.()
      onClose()
    } else {
      setError(data.error ?? res.statusText ?? 'Failed to save')
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
            Passage: <code className="font-mono">{passageId}</code>. Preserve{' '}
            <code className="font-mono">[TOKEN] SET</code> and{' '}
            <code className="font-mono">{'{{INPUT}}'}</code> in body.
          </p>

          {fetching ? (
            <div className="text-zinc-500 animate-pulse py-8">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-900/20 text-red-300 text-sm rounded-lg">{error}</div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
                  Passage name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono text-sm"
                  placeholder="e.g. Arrival"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
                  Body (prose, macros)
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-mono text-sm"
                  placeholder="Passage text..."
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold">
                    Links (choices)
                  </label>
                  <button
                    type="button"
                    onClick={addLink}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    + Add link
                  </button>
                </div>
                <div className="space-y-2">
                  {links.map((link, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLink(i, 'label', e.target.value)}
                        placeholder="Label"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                      />
                      <select
                        value={link.target}
                        onChange={(e) => updateLink(i, 'target', e.target.value)}
                        className="w-48 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono"
                      >
                        <option value="">— target —</option>
                        {passageNames.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeLink(i)}
                        disabled={links.length <= 1}
                        className="text-zinc-500 hover:text-red-400 text-sm disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition disabled:opacity-50 text-sm"
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
