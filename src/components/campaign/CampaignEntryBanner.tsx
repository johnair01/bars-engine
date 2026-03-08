'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { dismissCampaignEntry } from '@/actions/onboarding'

type CampaignEntryBannerProps = {
  nation: { id: string; name: string } | null
  playbook: { id: string; name: string } | null
  intendedImpact: string[]
  starterQuests: { id: string; title: string }[]
}

export function CampaignEntryBanner({
  nation,
  playbook,
  intendedImpact,
  starterQuests,
}: CampaignEntryBannerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDismiss = () => {
    startTransition(async () => {
      const result = await dismissCampaignEntry()
      if ('success' in result) {
        router.refresh()
      }
    })
  }

  return (
    <section className="bg-emerald-950/30 border border-emerald-700/50 rounded-2xl p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em]">
              Campaign Entry
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            You&apos;ve entered the Bruised Banana Campaign
          </h2>
          <p className="text-zinc-400 text-sm">
            Your identity and starter quests are ready. Begin your journey below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {nation && (
          <Link
            href="/nation"
            className="block p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-emerald-600/50 transition"
          >
            <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">
              Nation
            </div>
            <div className="text-white font-bold">{nation.name}</div>
          </Link>
        )}
        {playbook && (
          <Link
            href="/archetype"
            className="block p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-emerald-600/50 transition"
          >
            <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">
              Archetype
            </div>
            <div className="text-white font-bold">{playbook.name}</div>
          </Link>
        )}
        {intendedImpact.length > 0 && (
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">
              Intended Impact
            </div>
            <div className="text-white font-medium">
              {intendedImpact.join(', ')}
            </div>
          </div>
        )}
      </div>

      {starterQuests.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500">
            Starter Quests
          </div>
          <ul className="flex flex-wrap gap-2">
            {starterQuests.map((q) => (
              <li key={q.id}>
                <Link
                  href="/campaign/board?ref=bruised-banana"
                  className="inline-block px-3 py-1.5 bg-zinc-800/80 border border-zinc-700 rounded-lg text-sm text-zinc-200 hover:border-emerald-600/50 hover:text-white transition"
                >
                  {q.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-2">
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isPending}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/30"
        >
          {isPending ? 'Entering...' : 'Enter the Flow'}
        </button>
      </div>
    </section>
  )
}
