'use client'

import Link from 'next/link'
import type { CampaignSkin } from '@/lib/ui/campaign-skin'
import {
  buildSkinVars,
  resolveFontClass,
  DEFAULT_BG_GRADIENT,
  type ThemeData,
} from '@/lib/ui/build-skin-vars'

// ─── Types ──────────────────────────────────────────────────────────────────

export type ShareableCampaignData = {
  id: string
  slug: string
  name: string
  description: string | null
  allyshipDomain: string | null
  wakeUpContent: string | null
  showUpContent: string | null
  storyBridgeCopy: string | null
  startDate: string | null
  endDate: string | null
  instanceName: string
  createdByName: string | null
  theme: ThemeData | null
}

type ShareableCampaignPageProps = {
  campaign: ShareableCampaignData
  staticSkin: CampaignSkin | null
  /** Invite token to embed in the join CTA URL */
  inviteToken?: string | null
  /** Name of the person who shared/invited */
  inviterName?: string | null
  /** Whether the viewer is already authenticated */
  isAuthenticated?: boolean
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null
  const parts: string[] = []
  if (start) parts.push(formatDate(start))
  if (start && end) parts.push(' \u2014 ')
  if (end) parts.push(formatDate(end))
  return parts.join('')
}

/** Map allyship domain keys to human-readable labels */
function getDomainBadge(domain: string | null): string | null {
  if (!domain) return null
  const labels: Record<string, string> = {
    GATHERING_RESOURCES: 'Gathering Resources',
    DIRECT_ACTION: 'Direct Action',
    RAISE_AWARENESS: 'Raising Awareness',
    SKILLFUL_ORGANIZING: 'Skillful Organizing',
  }
  return labels[domain] ?? null
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Shareable campaign page — public-facing, optimized for link sharing.
 *
 * Displays campaign identity (name, description, poster, skin) with a
 * prominent join/invite CTA. Designed for the URL someone receives when
 * a campaign link is shared via social media, messaging, or email.
 *
 * Theming: two-layer system via buildSkinVars (static skin + DB theme).
 * All colors use CSS custom properties with --cs- prefix.
 *
 * Layout: thumb-first per UI_COVENANT — primary CTA in bottom 40%.
 */
export function ShareableCampaignPage({
  campaign,
  staticSkin,
  inviteToken,
  inviterName,
  isAuthenticated = false,
}: ShareableCampaignPageProps) {
  const skinVars = buildSkinVars(campaign.theme, staticSkin)
  const fontClass = resolveFontClass(campaign.theme, staticSkin)
  const dateRange = formatDateRange(campaign.startDate, campaign.endDate)
  const domainBadge = getDomainBadge(campaign.allyshipDomain)

  // Build join CTA href — include invite token when available
  const joinHref = inviteToken
    ? `/campaign/${encodeURIComponent(campaign.slug)}?invite=${encodeURIComponent(inviteToken)}`
    : isAuthenticated
      ? `/campaign/hub?ref=${encodeURIComponent(campaign.slug)}`
      : `/campaign/${encodeURIComponent(campaign.slug)}`

  const joinLabel = isAuthenticated ? 'Enter Campaign' : 'Join Campaign'

  return (
    <div
      className="min-h-screen text-[var(--cs-text-primary,#e8e6e0)] flex flex-col"
      style={{
        background:
          (skinVars as Record<string, string>)['--cs-bg-gradient'] ?? DEFAULT_BG_GRADIENT,
        ...skinVars,
      }}
    >
      {/* ── Hero / Poster ────────────────────────────────────────────── */}
      <header className="relative px-6 pt-10 pb-6 sm:px-10 sm:pt-14 max-w-2xl mx-auto w-full">
        {/* Poster image */}
        {campaign.theme?.posterImageUrl && (
          <div className="mb-6 rounded-xl overflow-hidden border border-[var(--cs-border,rgba(200,160,255,0.15))] shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={campaign.theme.posterImageUrl}
              alt={`${campaign.name} campaign poster`}
              className="w-full object-cover max-h-72 sm:max-h-96"
            />
          </div>
        )}

        {/* Domain badge */}
        {domainBadge && (
          <p
            className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3"
            style={{ color: 'var(--cs-accent-1, #c8a0ff)' }}
          >
            {domainBadge}
          </p>
        )}

        {/* Campaign name */}
        <h1
          className={`text-3xl sm:text-5xl font-bold leading-tight ${fontClass}`}
          style={{ color: 'var(--cs-title, #f0d000)' }}
        >
          {campaign.name}
        </h1>

        {/* Meta line: instance + creator */}
        <p className="mt-3 text-sm text-[var(--cs-text-secondary,#9090c0)]">
          {campaign.instanceName}
          {campaign.createdByName && <> &middot; by {campaign.createdByName}</>}
        </p>

        {/* Date range */}
        {dateRange && (
          <p className="mt-1 text-xs text-[var(--cs-text-muted,#6060a0)]">
            {dateRange}
          </p>
        )}

        {/* Inviter callout */}
        {inviterName && (
          <div
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{
              background: 'var(--cs-surface, rgba(10, 10, 40, 0.6))',
              border: '1px solid var(--cs-border, rgba(200, 160, 255, 0.15))',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--cs-accent-1, #c8a0ff)' }}
            />
            <span className="text-[var(--cs-text-secondary,#9090c0)]">
              <span style={{ color: 'var(--cs-text-primary, #e8e6e0)' }}>
                {inviterName}
              </span>{' '}
              invited you
            </span>
          </div>
        )}
      </header>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <main className="flex-1 px-6 sm:px-10 max-w-2xl mx-auto w-full space-y-8">
        {/* Description */}
        {campaign.description && (
          <section className="text-base leading-relaxed whitespace-pre-line">
            {campaign.description}
          </section>
        )}

        {/* Wake Up: "The Story" */}
        {campaign.wakeUpContent && (
          <section
            className="rounded-xl p-5"
            style={{
              background: 'var(--cs-surface, rgba(10, 10, 40, 0.6))',
              border: '1px solid var(--cs-border, rgba(200, 160, 255, 0.15))',
            }}
          >
            <h2
              className={`text-sm font-semibold uppercase tracking-wider mb-3 ${fontClass}`}
              style={{ color: 'var(--cs-accent-1, #c8a0ff)' }}
            >
              The Story
            </h2>
            <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--cs-text-secondary,#9090c0)]">
              {campaign.wakeUpContent}
            </div>
          </section>
        )}

        {/* Show Up: "How to Contribute" */}
        {campaign.showUpContent && (
          <section
            className="rounded-xl p-5"
            style={{
              background: 'var(--cs-surface, rgba(10, 10, 40, 0.6))',
              border: '1px solid var(--cs-border, rgba(200, 160, 255, 0.15))',
            }}
          >
            <h2
              className={`text-sm font-semibold uppercase tracking-wider mb-3 ${fontClass}`}
              style={{ color: 'var(--cs-accent-2, #00d4ff)' }}
            >
              How to Contribute
            </h2>
            <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--cs-text-secondary,#9090c0)]">
              {campaign.showUpContent}
            </div>
          </section>
        )}

        {/* Story bridge copy */}
        {campaign.storyBridgeCopy && (
          <section
            className="border-t pt-6"
            style={{ borderColor: 'var(--cs-border, rgba(200, 160, 255, 0.15))' }}
          >
            <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--cs-text-muted,#6060a0)] italic">
              {campaign.storyBridgeCopy}
            </div>
          </section>
        )}
      </main>

      {/* ── CTA Footer (thumb-first: primary actions in bottom 40%) ── */}
      <footer className="sticky bottom-0 px-6 sm:px-10 py-6 max-w-2xl mx-auto w-full">
        {/* Gradient fade above sticky footer */}
        <div
          className="absolute inset-x-0 -top-8 h-8 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, transparent, ${
              (skinVars as Record<string, string>)['--cs-bg-deep'] ?? '#1a1a2e'
            })`,
          }}
        />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Primary CTA: Join / Enter */}
          <Link
            href={joinHref}
            className="flex-1 text-center py-3.5 px-6 rounded-xl text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'var(--cs-cta-bg, #f0d000)',
              color: 'var(--cs-cta-text, #12124a)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            {joinLabel}
          </Link>

          {/* Secondary CTA: Share */}
          <ShareButton campaignName={campaign.name} />
        </div>

        {/* Home link */}
        <p className="mt-4 text-center">
          <Link
            href="/"
            className="text-xs transition-colors"
            style={{ color: 'var(--cs-text-muted, #6060a0)' }}
          >
            &larr; Home
          </Link>
        </p>
      </footer>
    </div>
  )
}

// ─── Share Button (client-side Web Share API with clipboard fallback) ────

function ShareButton({ campaignName }: { campaignName: string }) {
  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const shareData = {
      title: campaignName,
      text: `Join the ${campaignName} campaign`,
      url,
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData)
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        // Visual feedback would go here (toast) — kept simple for now
      }
    } catch {
      // User cancelled share dialog — no-op
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="py-3 px-5 rounded-xl text-sm font-medium transition-colors"
      style={{
        background: 'var(--cs-cta-secondary-bg, rgba(200, 160, 255, 0.15))',
        color: 'var(--cs-cta-secondary-text, #c8a0ff)',
        border: '1px solid var(--cs-cta-secondary-border, rgba(200, 160, 255, 0.4))',
      }}
    >
      Share Campaign
    </button>
  )
}
