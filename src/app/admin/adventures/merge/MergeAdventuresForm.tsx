'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { mergeAdventures } from '@/actions/quest-grammar'
import Link from 'next/link'

type Adventure = { id: string; title: string; slug: string; _count: { passages: number } }

export function MergeAdventuresForm({ adventures }: { adventures: Adventure[] }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [resultId, setResultId] = useState<string | null>(null)

  function toggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleMerge() {
    if (selectedIds.length < 2) {
      setStatus('error')
      setMessage('Select at least 2 adventures.')
      return
    }
    setStatus('loading')
    setMessage('')
    setResultId(null)
    const res = await mergeAdventures(
      Array.from(selectedIds),
      title.trim() || undefined,
      slug.trim() || undefined
    )
    if (res.success) {
      setStatus('success')
      setResultId(res.adventureId)
      router.refresh()
    } else {
      setStatus('error')
      setMessage(res.error)
    }
  }

  return (
    <div className="space-y-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Select adventures to merge</label>
        <p className="text-xs text-zinc-500 mb-3">Order matters: the first selected adventure&apos;s start node becomes the new start.</p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {adventures.map((adv) => (
            <label key={adv.id} className="flex items-center gap-3 cursor-pointer hover:bg-zinc-800/50 p-2 rounded">
              <input
                type="checkbox"
                checked={selectedIds.includes(adv.id)}
                onChange={() => toggle(adv.id)}
                className="rounded border-zinc-600 text-purple-500"
              />
              <span className="text-zinc-300">{adv.title}</span>
              <span className="text-zinc-500 text-xs">({adv._count.passages} passages)</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-1">
            Title (optional)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Merged: A + B"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-zinc-300 mb-1">
            Slug (optional)
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="merged-123"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
      {message && (
        <p className={`text-sm ${status === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>{message}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleMerge}
          disabled={status === 'loading' || selectedIds.length < 2}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Merging…' : 'Merge Adventures'}
        </button>
        {resultId && (
          <Link
            href={`/admin/adventures/${resultId}`}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            View merged Adventure →
          </Link>
        )}
      </div>
    </div>
  )
}
