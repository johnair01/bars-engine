'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { forkBookFromLibrary } from '@/actions/book-fork'
import type { AdminBookRow } from './book-admin-types'
import { parseBookMeta } from './book-admin-types'

function originLabel(origin: string) {
  switch (origin) {
    case 'forked_derivative':
      return 'Fork (derivative)'
    case 'manuscript_composed':
      return 'Manuscript'
    default:
      return 'Library / ingested'
  }
}

export function BookOriginForkPanel({ book }: { book: AdminBookRow }) {
  const router = useRouter()
  const meta = parseBookMeta(book.metadataJson)
  const tocCount = (meta?.toc?.entries ?? []).length
  const [title, setTitle] = useState(`${book.title} (fork)`)
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">
          Origin: {originLabel(book.bookOrigin)}
        </span>
        {book.parentBook && book.parentBookId ? (
          <Link
            href={`/admin/books/${book.parentBook.id}`}
            className="text-violet-400 hover:text-violet-300"
          >
            Parent: {book.parentBook.title}
          </Link>
        ) : null}
      </div>
      {book.parentBookId ? (
        <p>
          <Link
            href={`/admin/books/${book.id}/import-gameplay?source=${encodeURIComponent(book.parentBookId)}`}
            className="text-sm text-amber-400 hover:text-amber-300"
          >
            Import gameplay from parent →
          </Link>
        </p>
      ) : null}

      {tocCount > 0 ? (
        <div className="space-y-2 border-t border-zinc-800/80 pt-3">
          <h3 className="text-sm font-medium text-zinc-400">Fork for authoring</h3>
          <p className="text-xs text-zinc-600">
            Creates a new book (<code className="text-zinc-500">forked_derivative</code>) and scaffolds{' '}
            <strong>{tocCount}</strong> sections from this book&apos;s TOC.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full max-w-md rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
            disabled={pending}
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional steward note"
            className="w-full max-w-md rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
            disabled={pending}
          />
          {msg && (
            <p className={`text-xs ${/error|not found|required|Admin/i.test(msg) ? 'text-red-400' : 'text-emerald-400'}`}>
              {msg}
            </p>
          )}
          <button
            type="button"
            disabled={pending || !title.trim()}
            onClick={() => {
              setMsg(null)
              startTransition(async () => {
                const r = await forkBookFromLibrary({
                  parentBookId: book.id,
                  newTitle: title.trim(),
                  options: { includeTocSections: true, stewardNote: note.trim() || undefined },
                })
                if ('error' in r) setMsg(r.error)
                else {
                  router.push(`/admin/books/${r.bookId}`)
                  router.refresh()
                }
              })
            }}
            className="rounded bg-violet-800 px-3 py-2 text-sm text-white hover:bg-violet-700 disabled:opacity-40"
          >
            Fork book
          </button>
        </div>
      ) : (
        <p className="text-xs text-zinc-600 border-t border-zinc-800/80 pt-3">
          Fork needs TOC entries — run <strong>Extract TOC</strong> after text extraction.
        </p>
      )}
    </div>
  )
}
