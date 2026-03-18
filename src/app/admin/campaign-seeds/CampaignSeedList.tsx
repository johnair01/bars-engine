'use client'

import { useTransition } from 'react'
import { promoteCampaignBarToInstance } from '@/actions/campaign-bar'
import Link from 'next/link'

type Seed = Awaited<ReturnType<typeof import('@/actions/campaign-bar').listCampaignSeeds>>[number]

export function CampaignSeedList({ seeds }: { seeds: Seed[] }) {
  const [pending, startTransition] = useTransition()

  if (seeds.length === 0) {
    return (
      <p className="text-zinc-500 text-sm italic">
        No campaign seeds yet. Create one above.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {seeds.map((s) => (
        <div
          key={s.id}
          className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/50 space-y-2"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-white">{s.title}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">by {s.creatorName}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                {s.completedFaces}/{s.totalFaces} faces
              </span>
              {s.promotedInstance ? (
                <Link
                  href={`/admin/instances`}
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  → {s.promotedInstance.slug}
                </Link>
              ) : s.isComplete ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      const result = await promoteCampaignBarToInstance(s.id)
                      if (result.error) alert(result.error)
                      else if (result.slug) window.location.reload()
                    })
                  }}
                  className="text-xs px-2 py-1 rounded bg-green-900/50 text-green-300 hover:bg-green-900/70 disabled:opacity-50"
                >
                  {pending ? '…' : 'Promote to campaign'}
                </button>
              ) : null}
            </div>
          </div>
          <p className="text-sm text-zinc-400 line-clamp-2">{s.description}</p>
          <div className="flex flex-wrap gap-1">
            {['shaman', 'regent', 'challenger', 'architect', 'diplomat', 'sage'].map(
              (f) => (
                <span
                  key={f}
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    s.wateringProgress[f]
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-zinc-800/50 text-zinc-500'
                  }`}
                >
                  {f}
                </span>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
