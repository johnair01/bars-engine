'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAdventureAndThreadFromTwee } from '@/actions/quest-grammar'
import Link from 'next/link'

export function ImportTwee() {
  const [tweeSource, setTweeSource] = useState('')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tweeSource.trim()) {
      setStatus('error')
      setMessage('Paste .twee source to import.')
      return
    }
    setStatus('loading')
    setMessage('')
    const result = await createAdventureAndThreadFromTwee(
      tweeSource.trim(),
      title.trim() || undefined,
      slug.trim() || undefined
    )
    if (result.success) {
      setStatus('success')
      setMessage(`Created Adventure and QuestThread.`)
      router.push(`/admin/adventures/${result.adventureId}`)
    } else {
      setStatus('error')
      setMessage(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="twee" className="block text-sm font-medium text-zinc-300 mb-1">
          .twee source
        </label>
        <textarea
          id="twee"
          value={tweeSource}
          onChange={(e) => setTweeSource(e.target.value)}
          placeholder={':: StoryTitle\nMy Story\n\n:: StoryData\n{"start":"Start"}\n\n:: Start\nFirst passage text.\n[[Next->Next]]\n\n:: Next\nSecond passage.'}
          rows={12}
          className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
        />
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
            placeholder="From StoryTitle if empty"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
            placeholder="Auto-generated if empty"
            className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>
      {message && (
        <p
          className={`text-sm ${status === 'error' ? 'text-red-400' : status === 'success' ? 'text-emerald-400' : 'text-zinc-400'}`}
        >
          {message}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Importing…' : 'Import from .twee'}
        </button>
        <Link
          href="/admin/adventures"
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
        >
          View Adventures
        </Link>
      </div>
    </form>
  )
}
