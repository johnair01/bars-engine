'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { generateAllSubcampaigns } from './actions'
import { KOTTER_STAGES } from '@/lib/kotter'

export function GenerateAllForm({
  campaignRef,
  hasKernel,
}: {
  campaignRef: string
  hasKernel: boolean
}) {
  const [kotterStage, setKotterStage] = useState<number>(1)
  const [result, setResult] = useState<{ created: string[] } | { error: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleGenerate() {
    setResult(null)
    startTransition(async () => {
      const r = await generateAllSubcampaigns(campaignRef, kotterStage)
      setResult(r)
      if ('created' in r) router.refresh()
    })
  }

  return (
    <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
          Generate All Subcampaigns
        </h2>
        <span className="text-xs text-zinc-500">
          4 domains × 9 passages = 36 passages
        </span>
      </div>

      {!hasKernel && (
        <p className="text-sm text-amber-400">
          Set a narrative kernel above before generating.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={kotterStage}
          onChange={(e) => setKotterStage(Number(e.target.value))}
          disabled={isPending || !hasKernel}
          className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
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
          disabled={isPending || !hasKernel}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {isPending ? (
            <>
              <span className="inline-block w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Generating all domains…
            </>
          ) : (
            '⚡ Generate All Subcampaigns'
          )}
        </button>
      </div>

      {isPending && (
        <p className="text-xs text-zinc-500 animate-pulse">
          Calling GM agents for all 4 domains in parallel. This may take up to 2 minutes…
        </p>
      )}

      {result && 'created' in result && (
        <div className="space-y-1">
          <p className="text-sm text-emerald-400">
            ✓ {result.created.length} adventures created as drafts
          </p>
          <div className="flex flex-wrap gap-2">
            {result.created.map((id) => (
              <Link
                key={id}
                href={`/admin/adventures/${id}`}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Edit adventure →
              </Link>
            ))}
          </div>
        </div>
      )}
      {result && 'error' in result && (
        <p className="text-sm text-red-400">{result.error}</p>
      )}
    </div>
  )
}
