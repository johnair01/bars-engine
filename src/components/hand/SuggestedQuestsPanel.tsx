'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type QuestRow = { id: string; title: string }

/**
 * Thin vault slice: quest catalog preview (GET /api/quests). Mount from /hand when env is set.
 */
export function SuggestedQuestsPanel() {
  const [quests, setQuests] = useState<QuestRow[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/quests?limit=5', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((j: { quests?: QuestRow[] }) => {
        if (!cancelled) {
          setQuests((j.quests ?? []).map((q) => ({ id: q.id, title: q.title })))
        }
      })
      .catch(() => {
        if (!cancelled) setQuests([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3 space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-amber-500/90">Quest routing</p>
      <p className="text-xs text-zinc-500">
        Sample of the matchable quest catalog — persist BAR→quest links via{' '}
        <code className="text-zinc-400">/api/bar-quest-links</code>.
      </p>
      {quests === null ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : quests.length === 0 ? (
        <p className="text-sm text-zinc-500">No quests in catalog yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {quests.map((q) => (
            <li key={q.id} className="text-sm text-zinc-300 truncate">
              <span className="text-zinc-500 font-mono text-xs mr-2">{q.id.slice(0, 8)}…</span>
              {q.title}
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/bars/create"
        className="inline-block text-xs font-medium text-amber-400/90 hover:text-amber-300"
      >
        Create a BAR →
      </Link>
    </section>
  )
}
