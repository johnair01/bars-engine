'use client'

import { useTransition } from 'react'
import { promoteCampaignBarToInstance } from '@/actions/campaign-bar'

type Seed = Awaited<ReturnType<typeof import('@/actions/campaign-bar').listMyCampaignSeeds>>[number]

export function CampaignSeedReadyCard({ seeds }: { seeds: Seed[] }) {
  const ready = seeds.filter((s) => s.isComplete && !s.promotedInstance)
  if (ready.length === 0) return null

  const [pending, startTransition] = useTransition()

  return (
    <div className="rounded-xl border border-green-800/60 bg-green-950/30 p-4">
      <div className="text-[10px] uppercase tracking-widest text-green-400/80 mb-2">Your campaign is ready to bloom</div>
      <p className="text-sm text-zinc-300 mb-3">
        You&apos;ve watered all six faces. Promote your campaign seed to make it live.
      </p>
      <div className="space-y-2">
        {ready.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3">
            <span className="font-medium text-white truncate">{s.title}</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await promoteCampaignBarToInstance(s.id)
                  if (result.error) alert(result.error)
                  else if (result.slug) window.location.href = `/campaign/board?ref=${result.slug}`
                })
              }}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-green-700/50 text-green-200 hover:bg-green-600/60 text-sm font-medium disabled:opacity-50"
            >
              {pending ? '…' : 'Promote'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
