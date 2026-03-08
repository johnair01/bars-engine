'use client'

import { useState, useCallback } from 'react'

export function OnboardingDraftEditor() {
  const [expanded, setExpanded] = useState(false)
  const [tweeSource, setTweeSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const loadDraft = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/onboarding/draft')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || res.statusText)
      }
      const data = await res.json()
      setTweeSource(data.tweeSource ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load draft')
      setTweeSource('')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleExpand = useCallback(() => {
    if (!expanded) {
      setExpanded(true)
      loadDraft()
    } else {
      setExpanded(false)
      setError(null)
      setSuccess(false)
    }
  }, [expanded, loadDraft])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch('/api/admin/onboarding/draft', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweeSource }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || res.statusText)
      }
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }, [tweeSource])

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-zinc-800 bg-zinc-800/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-zinc-400 text-sm">Edit the raw .twee source. Changes apply immediately to the live flow.</p>
        <button
          type="button"
          onClick={handleExpand}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
        >
          {expanded ? 'Close editor' : 'Edit draft'}
        </button>
      </div>

      {expanded && (
        <div className="p-6 space-y-4">
          {loading && (
            <p className="text-zinc-500 italic">Loading draft...</p>
          )}
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          {success && (
            <p className="text-emerald-400 text-sm">Draft saved.</p>
          )}
          {!loading && (
            <>
              <textarea
                value={tweeSource}
                onChange={(e) => setTweeSource(e.target.value)}
                className="w-full h-96 min-h-[400px] p-4 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-200 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder=":: StoryTitle\nBruised Banana Onboarding Draft\n..."
                spellCheck={false}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition"
                >
                  {saving ? 'Saving...' : 'Save draft'}
                </button>
                <button
                  type="button"
                  onClick={loadDraft}
                  disabled={loading}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-200 text-sm font-bold rounded-lg transition"
                >
                  Reload
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
