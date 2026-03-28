'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AnchorData } from '@/lib/spatial-world/pixi-room'

type Props = {
  anchor: AnchorData
  onClose: () => void
}

export function LibrarianNpcModal({ anchor, onClose }: Props) {
  const router = useRouter()
  const title = anchor.label ?? 'Regent (Librarian)'

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-white font-bold">{title}</h2>
        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm shrink-0">
          Close
        </button>
      </div>
      <p className="text-zinc-300 text-sm leading-relaxed">
        The Regent keeps the <span className="text-amber-200/90">order of the library</span> — quests, threads, and
        what your table has committed to the record. When you are ready, step into the stacks.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            onClose()
            router.push('/library')
          }}
          className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium"
        >
          Open Library
        </button>
        <Link
          href="/wiki"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-200 hover:bg-zinc-800 text-sm font-medium text-center"
        >
          Player Wiki
        </Link>
      </div>
    </div>
  )
}
