import Link from 'next/link'
import type { VaultEventInviteBarRow } from '@/lib/vault-event-invite-bars'
import { getVaultBaseUrl } from '@/lib/vault-queries'
import { VaultEventInviteBarLinksEditor } from '@/components/hand/VaultEventInviteBarLinksEditor'

function publicInvitePath(barId: string) {
  const base = getVaultBaseUrl()
  const path = `/invite/event/${barId}`
  return base ? `${base}${path}` : path
}

/**
 * Lists event_invite BARs for campaign owners/stewards (and creators). BBR P0.
 * Placement: **Hand → Vault** (`/hand`), directly under the four-move room grid (Charge / Quests / Drafts / Who).
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
      <p className="text-xs text-zinc-500 leading-relaxed">
        Each BAR&apos;s public page is <span className="font-mono text-zinc-400">/invite/event/&lt;barId&gt;</span> — paste
        that into Partiful as the engine link. Set Partiful RSVP + initiation slug below (campaign owner/steward or admin).
      </p>
      {bars.length === 0 ? (
        <div className="rounded-lg border border-fuchsia-900/25 bg-fuchsia-950/10 px-4 py-3 text-xs text-zinc-400 leading-relaxed">
          <p className="text-zinc-300 font-medium mb-1">Nothing listed here yet</p>
          <p>
            This block only shows <strong className="text-zinc-400 font-normal">event_invite</strong> BARs you{' '}
            <strong className="text-zinc-400 font-normal">created</strong>, or whose <strong className="text-zinc-400 font-normal">campaign</strong>{' '}
            matches an instance where you&apos;re <strong className="text-zinc-400 font-normal">owner</strong> or{' '}
            <strong className="text-zinc-400 font-normal">steward</strong>. <strong className="text-zinc-400 font-normal">Admin</strong> accounts see
            all active invite BARs.
          </p>
          <p className="mt-2 text-zinc-500">
            Scroll to just <span className="text-zinc-400">below</span> the four big room tiles on this page — that&apos;s where this section
            lives.
          </p>
        </div>
      ) : null}
      {bars.length > 0 ? (
        <ul className="space-y-2">
          {bars.map((bar) => {
            const href = publicInvitePath(bar.id)
            return (
              <li
                key={bar.id}
                className="rounded-lg border border-fuchsia-900/35 bg-fuchsia-950/15 px-4 py-3 space-y-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium text-fuchsia-100">{bar.title}</p>
                  {bar.campaignRef && (
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 shrink-0">
                      {bar.campaignRef}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Link
                    href={`/invite/event/${bar.id}`}
                    className="inline-flex items-center text-fuchsia-300 hover:text-fuchsia-200 underline-offset-2 hover:underline"
                  >
                    Preview invite →
                  </Link>
                  <span className="text-zinc-600">·</span>
                  <a
                    href={href}
                    className="inline-flex items-center text-zinc-400 hover:text-zinc-300 break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Copy path: {href}
                  </a>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {bar.partifulUrl?.trim() ? (
                    <a
                      href={bar.partifulUrl.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md border border-pink-700/50 bg-pink-950/30 px-2 py-1 text-[11px] font-semibold text-pink-200 hover:bg-pink-900/40"
                    >
                      Test Partiful →
                    </a>
                  ) : (
                    <span className="text-[11px] text-amber-400/90">Add your Partiful URL in the form below for RSVP.</span>
                  )}
                  {bar.eventSlug?.trim() ? (
                    <Link
                      href={`/campaign/event/${encodeURIComponent(bar.eventSlug.trim())}/initiation`}
                      className="inline-flex items-center justify-center rounded-md border border-violet-800/50 bg-violet-950/30 px-2 py-1 text-[11px] font-semibold text-violet-200 hover:bg-violet-900/40"
                    >
                      Test initiation →
                    </Link>
                  ) : null}
                </div>
                <VaultEventInviteBarLinksEditor
                  barId={bar.id}
                  initialPartifulUrl={bar.partifulUrl}
                  initialEventSlug={bar.eventSlug}
                />
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
