'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateBookPraxisMetadata } from '@/actions/books'
import {
  PRAXIS_PILLAR_LABELS,
  PRAXIS_PILLAR_COLORS,
  parsePraxisMetadata,
  type PraxisPillarId,
} from '@/lib/books/praxisMetadata'

const PILLARS: Array<{ id: PraxisPillarId; label: string }> = [
  { id: 'antifragile', label: 'Antifragile' },
  { id: 'commons_networks', label: 'Commons / Networks' },
  { id: 'felt_sense', label: 'Felt Sense' },
]

type Props = {
  bookId: string
  metadataJson: string | null
}

export function BookPraxisBadge({ metadataJson }: { metadataJson: string | null }) {
  const { praxisPillar } = parsePraxisMetadata(metadataJson)
  if (!praxisPillar) return null
  const colors = PRAXIS_PILLAR_COLORS[praxisPillar]
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colors}`}>
      {PRAXIS_PILLAR_LABELS[praxisPillar]}
    </span>
  )
}

export function BookPraxisPanel({ bookId, metadataJson }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  const current = parsePraxisMetadata(metadataJson)
  const [pillar, setPillar] = useState<PraxisPillarId | ''>(current.praxisPillar ?? '')
  const [intent, setIntent] = useState(current.designIntentSummary ?? '')
  const [strandNote, setStrandNote] = useState(current.strandNote ?? '')

  const handleSave = () => {
    setResult(null)
    startTransition(async () => {
      const res = await updateBookPraxisMetadata(bookId, {
        praxisPillar: pillar || undefined,
        designIntentSummary: intent.trim() || undefined,
        strandNote: strandNote.trim() || undefined,
      })
      if ('error' in res) {
        setResult(`Error: ${res.error}`)
      } else {
        setResult('Saved.')
        setOpen(false)
        router.refresh()
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] px-2 py-0.5 rounded border border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition"
      >
        {current.praxisPillar ? 'Edit pillar' : 'Set pillar'}
      </button>
    )
  }

  return (
    <div className="mt-3 space-y-3 border-t border-zinc-800 pt-3">
      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Praxis pillar</p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setPillar('')}
          className={`text-xs px-3 py-1 rounded-lg border transition ${
            pillar === ''
              ? 'border-zinc-500 text-zinc-200 bg-zinc-800'
              : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
          }`}
        >
          Unset
        </button>
        {PILLARS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPillar(p.id)}
            className={`text-xs px-3 py-1 rounded-lg border transition ${
              pillar === p.id
                ? `${PRAXIS_PILLAR_COLORS[p.id]} font-bold`
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-xs text-zinc-500">Design intent (admin-facing)</label>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          rows={2}
          placeholder="Why this book is in the library…"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-zinc-500"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-zinc-500">Strand / provenance note (optional)</label>
        <input
          type="text"
          value={strandNote}
          onChange={(e) => setStrandNote(e.target.value)}
          placeholder="e.g. Diplomat strand consult suggested…"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="text-xs px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition font-medium"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={() => {
            setOpen(false)
            setResult(null)
          }}
          className="text-xs px-4 py-2 border border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg transition"
        >
          Cancel
        </button>
        {result && <span className="text-xs text-zinc-400">{result}</span>}
      </div>
    </div>
  )
}
