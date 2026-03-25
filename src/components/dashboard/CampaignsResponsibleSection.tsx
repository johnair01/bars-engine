import Link from 'next/link'
import type { CampaignForPlayer } from '@/actions/campaign-overview'
import { campaignHomePath } from '@/lib/campaign-player-home'

type Props = {
  campaigns: CampaignForPlayer[]
  /** Fallback ref when a row has no `campaignRef`. */
  defaultCampaignRef: string
  /** When true, links use `/campaign?ref=` (BB onboarding funnel); else `/campaign/hub?ref=`. */
  needsCampaignOnboardingRoute: boolean
}

export function CampaignsResponsibleSection({
  campaigns,
  defaultCampaignRef,
  needsCampaignOnboardingRoute,
}: Props) {
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
        {campaigns.map((c) => {
          const ref = (c.campaignRef?.trim() && c.campaignRef.length > 0 ? c.campaignRef : null) ?? defaultCampaignRef
          const href = campaignHomePath({
            campaignRef: ref,
            useOnboardingCampaignRoute: needsCampaignOnboardingRoute,
          })
          return (
          <Link
            key={c.id}
            href={href}
            className="block rounded-lg border border-zinc-700 bg-zinc-950/50 p-3 hover:border-zinc-600 hover:bg-zinc-900/50 transition-colors"
          >
            <div className="font-medium text-white">{c.name}</div>
            <div className="text-xs text-amber-400/90 mt-1">{c.nextMilestone}</div>
          </Link>
          )
        })}
      </div>
    </section>
  )
}
