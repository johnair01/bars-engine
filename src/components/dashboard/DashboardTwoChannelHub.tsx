import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { SCENE_ATLAS_DISPLAY_NAME } from '@/lib/creator-scene-grid-deck/branding'
import { ELEMENT_TOKENS, type ElementKey, altitudeCssVars, elementCssVars } from '@/lib/ui/card-tokens'

type HubProps = {
  /** Optional active instance — I Ching field context. */
  activeInstanceId?: string | null
  /** Canonical campaign entry (hub vs onboarding) from dashboard. */
  campaignHomeHref: string
}

type ChannelRowProps = {
  href: string
  title: string
  description: string
}

/**
 * Single destination row — cultivation-card chrome, inherited channel element vars (UI Covenant).
 */
function DashboardChannelRow({ href, title, description }: ChannelRowProps) {
  return (
    <li className="min-w-0">
      <Link
        href={href}
        className="cultivation-card block px-3 py-2.5 min-h-[44px] rounded-lg no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/35"
      >
        <span className="font-semibold text-sm text-zinc-100 leading-snug">{title}</span>
        <span className="block text-xs text-zinc-500 mt-0.5 leading-snug">{description}</span>
      </Link>
    </li>
  )
}

type ChannelPanelProps = {
  element: ElementKey
  channelLabel: string
  children: ReactNode
}

function ChannelPanel({ element, channelLabel, children }: ChannelPanelProps) {
  const t = ELEMENT_TOKENS[element]
  const shellStyle: CSSProperties = {
    ...elementCssVars(element),
    ...altitudeCssVars('neutral'),
  }

  return (
    <div
      className="rounded-xl border border-zinc-800/90 bg-[#1a1a18]/90 p-3 space-y-2.5 min-w-0"
      style={shellStyle}
    >
      <p className={`text-[10px] uppercase tracking-widest font-semibold ${t.textAccent}`}>{channelLabel}</p>
      <ul className="space-y-2 list-none p-0 m-0">{children}</ul>
    </div>
  )
}

/**
 * NOW dashboard hub: two channels (personal vs collective) with player-facing naming and tactile rows.
 * Replaces legacy “Throughput” block — see `.specify/specs/dashboard-two-channel-hub/spec.md`.
 *
 * Play CTAs: `/adventures` matches main PLAY tab; `/play` is the short demo loop for newcomers (SIX_FACE routing).
 */
export function DashboardTwoChannelHub({ activeInstanceId, campaignHomeHref }: HubProps) {
  const ichingHref =
    activeInstanceId != null && activeInstanceId !== ''
      ? `/iching?instanceId=${encodeURIComponent(activeInstanceId)}`
      : '/iching'

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-bold text-white tracking-tight">Practice &amp; field</h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-prose">
            Same move: feel it, then give it form — alone in your practice or out in the shared field.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 shrink-0">
          <Link
            href="/adventures"
            className="inline-flex items-center justify-center rounded-lg border-2 border-amber-800/60 bg-amber-950/35 px-4 py-2.5 min-h-[44px] text-sm font-bold text-amber-100 hover:bg-amber-900/45 hover:border-amber-600/70 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/50"
          >
            Play →
          </Link>
          <Link
            href="/play"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-600/80 bg-zinc-900/70 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-zinc-200 hover:bg-zinc-800 hover:border-zinc-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/35"
          >
            New? Demo loop →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ChannelPanel element="wood" channelLabel="Personal">
          <DashboardChannelRow href="/capture" title="Capture Charge" description="Name the voltage" />
          <DashboardChannelRow
            href="/creator-scene-deck"
            title={SCENE_ATLAS_DISPLAY_NAME}
            description="52-cell private deck"
          />
          <DashboardChannelRow href="/hand" title="Hand / Vault" description="Drafts, who moments & quests" />
        </ChannelPanel>

        <ChannelPanel element="fire" channelLabel="Collective">
          <DashboardChannelRow href={ichingHref} title="Cast I Ching" description="Reading for the field" />
          <DashboardChannelRow href="/game-map" title="Game map" description="Where we are" />
          <DashboardChannelRow
            href={campaignHomeHref}
            title="Campaign"
            description={'Residency hub (or onboarding if you\u2019re new)'}
          />
          <DashboardChannelRow
            href="/event"
            title="Residency events"
            description="Party nights, donate, invite bingo"
          />
          <DashboardChannelRow href="/world" title="Enter Lobby" description="Trade BARs in your nation room" />
        </ChannelPanel>
      </div>
    </section>
  )
}
