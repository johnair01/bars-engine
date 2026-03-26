import Link from 'next/link'
import type { VaultEventInviteBarRow } from '@/lib/vault-event-invite-bars'
import { CampaignInviteBarSendCard } from '@/components/hand/CampaignInviteBarSendCard'

/**
 * Lists event_invite BARs for campaign owners/stewards (and creators). BBR P0.
 * Placement: **Hand → Vault** (`/hand`), directly under the four-move room grid.
 */
export function VaultCampaignInviteBars({ bars }: { bars: VaultEventInviteBarRow[] }) {
  return (
    <section className="space-y-3" aria-labelledby="vault-campaign-invites-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="vault-campaign-invites-heading" className="text-[10px] uppercase tracking-widest text-fuchsia-500/90">
          Campaign invitation BARs
        </h2>
        <Link
          href="/hand/forge-invitation"
          className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-fuchsia-400/90"
        >
          Forge new →
        </Link>
      </div>

      {bars.length === 0 ? (
        <div className="rounded-lg border border-fuchsia-900/25 bg-fuchsia-950/10 px-4 py-3 text-xs text-zinc-400 leading-relaxed">
          <p className="text-zinc-300 font-medium mb-1">Nothing listed here yet</p>
          <p>
            This block only shows <strong className="text-zinc-400 font-normal">event_invite</strong> BARs you{' '}
            <strong className="text-zinc-400 font-normal">created</strong>, or whose{' '}
            <strong className="text-zinc-400 font-normal">campaign</strong> matches an instance where you&apos;re{' '}
            <strong className="text-zinc-400 font-normal">owner</strong> or{' '}
            <strong className="text-zinc-400 font-normal">steward</strong>.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {bars.map((bar) => (
            <CampaignInviteBarSendCard
              key={bar.id}
              barId={bar.id}
              title={bar.title}
              campaignRef={bar.campaignRef}
              partifulUrl={bar.partifulUrl}
              eventSlug={bar.eventSlug}
              initialTitle={bar.title}
              initialDescription={bar.description}
              initialStoryContent={bar.storyContent ?? ''}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
