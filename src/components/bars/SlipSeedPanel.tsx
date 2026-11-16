'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { maturityLabel, type MaturityPhase } from '@/lib/bar-seed-metabolization'

/**
 * The I Ching two-move slip on its BAR (Six-faces-council .specify/specs/iching-two-move FR-008 to FR-010): the growing
 * stage, one line when it is done, and the "Where this fits in the story" line that only the player writes. The game
 * never fills that line. The translation is credited here, as the card view credits it (ic2-moog-reach A).
 */
export function SlipSeedPanel(props: {
  barId: string
  maturity: MaturityPhase
  trigram: string
  good: string
  side: 'inner' | 'outer'
  whatHappened: string | null
  storyFit: string | null
}) {
  const router = useRouter()
  const done = props.maturity !== 'captured' && props.maturity !== 'context_named'
  const [line, setLine] = useState(props.whatHappened ?? '')
  const [story, setStory] = useState(props.storyFit ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function post(body: Record<string, unknown>) {
    setBusy(true)
    setErr(null)
    try {
      const r = await fetch('/api/between/slip', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ barId: props.barId, ...body }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || j.error) setErr(j.error || 'That did not save.')
      else router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-lg border border-amber-900/40 bg-amber-950/10 p-4 space-y-4" aria-label="Your I Ching slip">
      <div>
        <p className="text-xs uppercase tracking-wider text-amber-500/80">
          {props.side === 'inner' ? 'Inward move' : 'Outward move'} · {props.good} · {props.trigram}
        </p>
        <p data-testid="slip-stage" className="mt-1 text-sm text-zinc-300">
          {done ? 'Done, and grown into a BAR.' : 'A seed. It grows when you have done it.'}{' '}
          <span className="text-zinc-500">({maturityLabel(props.maturity)})</span>
        </p>
      </div>

      {done ? (
        <p className="text-sm text-zinc-300">{props.whatHappened}</p>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm text-zinc-300" htmlFor="slip-done">What happened</label>
          <textarea id="slip-done" value={line} onChange={e => setLine(e.target.value)} rows={2} maxLength={500}
            className="w-full rounded bg-zinc-900 border border-zinc-700 p-2 text-sm" />
          <button type="button" disabled={busy || !line.trim()} onClick={() => post({ do: 'done', whatHappened: line })}
            className="rounded bg-amber-700/80 px-3 py-1.5 text-sm text-white disabled:opacity-40">I did it</button>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm text-zinc-300" htmlFor="slip-story">Where this fits in the story</label>
        <textarea id="slip-story" value={story} onChange={e => setStory(e.target.value)} rows={2} maxLength={2000}
          placeholder="Yours to write. The game does not fill this in."
          className="w-full rounded bg-zinc-900 border border-zinc-700 p-2 text-sm" />
        <button type="button" disabled={busy || story === (props.storyFit ?? '')} onClick={() => post({ do: 'story', storyFit: story })}
          className="rounded border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200 disabled:opacity-40">Save this line</button>
      </div>

      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
      <p className="text-xs text-zinc-500">The trigram pairs come from the I Ching as translated by Anthony and Moog; the move is worded fresh.</p>
    </section>
  )
}
