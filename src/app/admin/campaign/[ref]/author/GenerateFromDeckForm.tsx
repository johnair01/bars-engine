'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { generateAdventureFromDeck } from './actions'
import { KOTTER_STAGES } from '@/lib/kotter'

export function GenerateFromDeckForm({
  campaignRef,
  subcampaignDomain,
}: {
  campaignRef: string
  subcampaignDomain: string
}) {
  const [kotterStage, setKotterStage] = useState<number>(1)
  const [result, setResult] = useState<{ adventureId: string } | { error: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleGenerate() {
    setResult(null)
    startTransition(async () => {
      const r = await generateAdventureFromDeck(campaignRef, subcampaignDomain, kotterStage)
      setResult(r)
      if ('adventureId' in r) router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-800">
      <select
        value={kotterStage}
        onChange={(e) => setKotterStage(Number(e.target.value))}
        disabled={isPending}
        className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
      >
        {(Object.entries(KOTTER_STAGES) as [string, { name: string }][]).map(([k, v]) => (
          <option key={k} value={k}>
            Stage {k} — {v.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors"
      >
        {isPending ? (
          <>
            <span className="inline-block w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Generating…
          </>
        ) : (
          '+ Generate from Deck'
        )}
      </button>

      {result && 'adventureId' in result && (
        <Link
          href={`/admin/adventures/${result.adventureId}`}
          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          ✓ Created — edit adventure →
        </Link>
      )}
      {result && 'error' in result && (
        <span className="text-sm text-red-400">{result.error}</span>
      )}
    </div>
  )
}
