'use client'

import Link from 'next/link'
import type { CampaignPageData, VisitorStatus } from './page'
import type { CampaignSkin } from '@/lib/ui/campaign-skin'
import { buildSkinVars, resolveFontClass, DEFAULT_BG_GRADIENT } from '@/lib/ui/build-skin-vars'
import { useCampaignSkin } from '@/lib/ui/campaign-skin-provider'

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
 * Public campaign landing page — renders campaign skin (poster, title,
 * description) with visitor-aware CTA.
 *
 * Three visitor states:
 *   - unauthenticated → "Join Campaign" (goes to signup/login)
 *   - non_member       → "Join Campaign" (goes to campaign signup)
 *   - member           → "Enter Campaign" (goes to campaign hub)
 *
 * Theming: two-layer system via buildSkinVars (static skin + DB theme).
 * All colors use CSS custom properties with --cs- prefix.
 *
 * Layout: thumb-first per UI_COVENANT — primary CTA in bottom 40%.
 */
export function CampaignLanding({
  campaign,
  staticSkin,
  visitorStatus = 'unauthenticated',
  inviteToken,
}: {
  campaign: CampaignPageData
  staticSkin: CampaignSkin | null
  visitorStatus?: VisitorStatus
  inviteToken?: string | null
}) {
  // Use campaign skin from provider (layout-level resolution) when available;
  // fall back to direct buildSkinVars for backward compatibility.
  const providerSkin = useCampaignSkin()
  const fontClass = providerSkin.hasCustomTheme
    ? providerSkin.fontDisplayClass
    : resolveFontClass(campaign.theme, staticSkin)
  const bgDeep = providerSkin.hasCustomTheme
    ? providerSkin.bgDeep
    : ((buildSkinVars(campaign.theme, staticSkin) as Record<string, string>)['--cs-bg-deep'] ?? '#1a1a2e')
  const hasDateRange = campaign.startDate || campaign.endDate
  const domainBadge = getDomainBadge(campaign.allyshipDomain)

  // ── CTA routing based on visitor status ──────────────────────────────────
  const isMember = visitorStatus === 'member'

  // Members go straight to the campaign home; visitors get a join flow
  const primaryHref = isMember
    ? `/campaign/${encodeURIComponent(campaign.slug)}/home`
    : inviteToken
      ? `/campaign/${encodeURIComponent(campaign.slug)}/join?invite=${encodeURIComponent(inviteToken)}`
      : `/campaign/${encodeURIComponent(campaign.slug)}/join`

  const primaryLabel = isMember ? 'Enter Campaign' : 'Join Campaign'

  // RSVP link (from static skin, e.g. Partiful) — shown for visitors only
  const rsvpUrl = staticSkin?.rsvpUrl ?? null
  const showRsvp = !isMember && !!rsvpUrl

  // Layout's CampaignSkinProvider already applies CSS vars + background via wrapper.
  // This component renders as a flex column within that skinned container.
  return (
    <div className="flex flex-col flex-1">
      {/* ── Poster / Hero ──────────────────────────────────────────────── */}
      <header className="relative px-6 pt-12 pb-8 sm:px-10 sm:pt-16 max-w-3xl mx-auto w-full">
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

        <h1
          className={`text-3xl sm:text-5xl font-bold leading-tight ${fontClass}`}
          style={{ color: 'var(--cs-title, #f0d000)' }}
        >
          {campaign.name}
        </h1>

        <p className="mt-3 text-sm text-[var(--cs-text-secondary,#9090c0)]">
          {campaign.instanceName}
          {campaign.createdByName && <> &middot; by {campaign.createdByName}</>}
        </p>

        {hasDateRange && (
          <p className="mt-1 text-xs text-[var(--cs-text-muted,#6060a0)]">
            {campaign.startDate && formatDate(campaign.startDate)}
            {campaign.startDate && campaign.endDate && ' — '}
            {campaign.endDate && formatDate(campaign.endDate)}
          </p>
        )}
      </header>

      {/* ── Body content ───────────────────────────────────────────────── */}
      <main className="flex-1 px-6 sm:px-10 pb-16 max-w-3xl mx-auto w-full space-y-8">
        {campaign.description && (
          <section className="text-base leading-relaxed whitespace-pre-line">
            {campaign.description}
          </section>
        )}

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

      {/* ── CTA Footer (thumb-first: primary actions in bottom 40%) ───── */}
      <footer className="sticky bottom-0 px-6 sm:px-10 py-6 max-w-3xl mx-auto w-full">
        {/* Gradient fade above sticky footer */}
        <div
          className="absolute inset-x-0 -top-8 h-8 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, transparent, ${bgDeep})`,
          }}
        />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Primary CTA: Join or Enter */}
          <Link
            href={primaryHref}
            className="flex-1 text-center py-3.5 px-6 rounded-xl text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'var(--cs-cta-bg, #f0d000)',
              color: 'var(--cs-cta-text, #12124a)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            {primaryLabel}
          </Link>

          {/* RSVP button — shown for non-members when a Partiful/external RSVP link exists */}
          {showRsvp && (
            <a
              href={rsvpUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-5 rounded-xl text-sm font-medium transition-colors text-center"
              style={{
                background: 'var(--cs-cta-secondary-bg, rgba(200, 160, 255, 0.15))',
                color: 'var(--cs-cta-secondary-text, #c8a0ff)',
                border: '1px solid var(--cs-cta-secondary-border, rgba(200, 160, 255, 0.4))',
              }}
            >
              RSVP
            </a>
          )}

          {/* Share button */}
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

// ─── Share Button (client-side Web Share API with clipboard fallback) ──────

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
      Share
    </button>
  )
}
