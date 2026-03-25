import Link from 'next/link'
import type { VaultEventInviteBarRow } from '@/lib/vault-event-invite-bars'
import { getVaultBaseUrl } from '@/lib/vault-queries'

function publicInvitePath(barId: string) {
  const base = getVaultBaseUrl()
  const path = `/invite/event/${barId}`
  return base ? `${base}${path}` : path
}

/**
 * Lists event_invite BARs for campaign owners/stewards (and creators). BBR P0.
 */
export function VaultCampaignInviteBars({ bars }: { bars: VaultEventInviteBarRow[] }) {
  if (bars.length === 0) return null

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
        Public links for Partiful + initiation. Share the invite URL; guests don&apos;t need to log in for the doorway.
      </p>
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
                  <span className="text-[11px] text-amber-400/90">Set Partiful URL on this BAR (admin/seed) for RSVP.</span>
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
            </li>
          )
        })}
      </ul>
    </section>
  )
}
