import Link from 'next/link'
import type { CampaignForPlayer } from '@/actions/campaign-overview'

export function CampaignsResponsibleSection({ campaigns }: { campaigns: CampaignForPlayer[] }) {
  if (campaigns.length === 0) return null

  return (
    <section className="rounded-xl border border-zinc-700 bg-zinc-900/30 p-4">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
        Campaigns I&apos;m responsible for
      </div>
      <p className="text-xs text-zinc-400 mb-3">
        What is the next smallest honest action?
      </p>
      <div className="space-y-3">
        {campaigns.map((c) => (
          <Link
            key={c.id}
            href={`/campaign${c.campaignRef ? `?ref=${encodeURIComponent(c.campaignRef)}` : ''}`}
            className="block rounded-lg border border-zinc-700 bg-zinc-950/50 p-3 hover:border-zinc-600 hover:bg-zinc-900/50 transition-colors"
          >
            <div className="font-medium text-white">{c.name}</div>
            <div className="text-xs text-amber-400/90 mt-1">{c.nextMilestone}</div>
          </Link>
        ))}
      </div>
    </section>
  )
}
