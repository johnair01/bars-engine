'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBookSection } from '@/actions/book-sections'

type SectionRow = {
  id: string
  title: string
  slug: string
  orderIndex: number
  status: string
  sectionType: string
  goal: string | null
  updatedAt: Date
}

export function BookSectionsClient({
  bookId,
  bookTitle,
  initialSections,
  loadError,
}: {
  bookId: string
  bookTitle: string
  initialSections: SectionRow[]
  loadError: string | null
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(loadError)

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const r = await createBookSection(bookId, { title, goal: goal || null })
      if ('error' in r) setMsg(r.error)
      else {
        setTitle('')
        setGoal('')
        setMsg('Section created.')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {msg && (
        <p
          className={`text-sm ${
            /not found|required|Admin access|Not logged/i.test(msg) ? 'text-red-400' : 'text-zinc-400'
          }`}
        >
          {msg}
        </p>
      )}

      <form onSubmit={onCreate} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">New section</h2>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            placeholder={`e.g. Chapter 1 — ${bookTitle}`}
            disabled={pending}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Goal (optional)</label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={2}
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
            disabled={pending}
          />
        </div>
        <button
          type="submit"
          disabled={pending || !title.trim()}
          className="rounded bg-violet-700 px-3 py-2 text-sm text-white hover:bg-violet-600 disabled:opacity-40"
        >
          {pending ? 'Creating…' : 'Create section'}
        </button>
      </form>

      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-2">Sections ({initialSections.length})</h2>
        {initialSections.length === 0 ? (
          <p className="text-sm text-zinc-600">No sections yet. Add one above.</p>
        ) : (
          <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
            {initialSections.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 hover:bg-zinc-900/50">
                <div>
                  <Link
                    href={`/admin/books/${bookId}/sections/${s.id}`}
                    className="text-sm font-medium text-violet-400 hover:text-violet-300"
                  >
                    {s.title}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    #{s.orderIndex} · {s.slug} ·{' '}
                    <span className="text-zinc-400">{s.status}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
