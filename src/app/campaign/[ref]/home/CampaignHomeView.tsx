'use client'

import Link from 'next/link'
import type { CampaignHomeData, CampaignHomeActivityItem } from '@/actions/campaign-home'
import type { CampaignSkin } from '@/lib/ui/campaign-skin'
import { buildSkinVars, resolveFontClass, DEFAULT_BG_GRADIENT } from '@/lib/ui/build-skin-vars'
import { useCampaignSkin } from '@/lib/ui/campaign-skin-provider'
import { PostJoinWelcomeBanner } from '@/components/campaign/PostJoinWelcomeBanner'

// ─── Element → Color mapping (UI_COVENANT three-channel encoding) ───────────

const ELEMENT_COLORS: Record<string, { frame: string; glow: string; label: string }> = {
  wood: { frame: '#4a7c59', glow: '#27AE60', label: 'Wood' },
  fire: { frame: '#c1392b', glow: '#e8671a', label: 'Fire' },
  earth: { frame: '#b5651d', glow: '#D4A017', label: 'Earth' },
  metal: { frame: '#8e9aab', glow: '#BDC3C7', label: 'Metal' },
  water: { frame: '#1a3a5c', glow: '#1a7a8a', label: 'Water' },
}

// ─── Activity type → icon mapping ───────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  welcome: '📖',
  quest: '⚔️',
  character_creation: '🎭',
  contribution: '🤝',
  scene: '🌿',
  explore: '🧭',
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * CampaignHomeView — post-join campaign home page.
 *
 * Shows campaign branding (skinned via getCampaignSkin + CampaignTheme),
 * membership status, and actionable activity items.
 *
 * Layout follows UI_COVENANT thumb-first principle:
 *   - Header: campaign name + welcome
 *   - Activity cards: primary actionable items in the mid-zone
 *   - Navigation: campaign hub + back links in the footer zone
 *
 * Three-channel encoding on activity cards:
 *   - Element → border/glow color (wood, fire, earth, metal, water)
 *   - Altitude → border weight (completed items fade; active items glow)
 *   - Stage → card density (completed = composted style; active = growing)
 */
export function CampaignHomeView({
  data,
  staticSkin,
  isNewlyJoined = false,
}: {
  data: CampaignHomeData
  staticSkin: CampaignSkin | null
  isNewlyJoined?: boolean
}) {
  // Use campaign skin from provider (layout-level resolution) when available
  const providerSkin = useCampaignSkin()
  const fontClass = providerSkin.hasCustomTheme
    ? providerSkin.fontDisplayClass
    : resolveFontClass(data.theme, staticSkin)

  const activeItems = data.activityItems.filter((item) => !item.completed)
  const completedItems = data.activityItems.filter((item) => item.completed)

  // Layout's CampaignSkinProvider already applies CSS vars + background via wrapper.
  return (
    <div className="flex flex-col flex-1">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="px-6 pt-10 pb-6 sm:px-10 sm:pt-14 max-w-2xl mx-auto w-full">
        {/* Welcome banner for newly joined members */}
        {isNewlyJoined && (
          <div className="mb-6">
            <PostJoinWelcomeBanner campaignName={data.campaign.name} />
          </div>
        )}

        {/* Campaign poster (if present) */}
        {data.theme?.posterImageUrl && (
          <div className="mb-5 rounded-xl overflow-hidden border border-[var(--cs-border,rgba(200,160,255,0.15))] shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.theme.posterImageUrl}
              alt={`${data.campaign.name} campaign`}
              className="w-full object-cover max-h-40 sm:max-h-56"
            />
          </div>
        )}

        <h1
          className={`text-2xl sm:text-4xl font-bold leading-tight ${fontClass}`}
          style={{ color: 'var(--cs-title, #f0d000)' }}
        >
          {data.campaign.name}
        </h1>

        <p className="mt-2 text-sm text-[var(--cs-text-secondary,#9090c0)]">
          {data.campaign.instanceName}
          {data.isStewardPlus && (
            <span
              className="ml-2 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded"
              style={{
                background: 'var(--cs-cta-secondary-bg, rgba(200, 160, 255, 0.15))',
                color: 'var(--cs-accent-1, #c8a0ff)',
              }}
            >
              {data.membership.roleKey ?? 'steward'}
            </span>
          )}
        </p>

        {data.campaign.description && (
          <p className="mt-3 text-sm leading-relaxed text-[var(--cs-text-secondary,#9090c0)] line-clamp-3">
            {data.campaign.description}
          </p>
        )}
      </header>

      {/* ── Activity Items (the "something to do") ──────────────────────── */}
      <main className="flex-1 px-6 sm:px-10 pb-8 max-w-2xl mx-auto w-full space-y-4">
        {/* Section heading */}
        <h2
          className="text-xs font-semibold uppercase tracking-[0.2em] mb-3"
          style={{ color: 'var(--cs-accent-2, #00d4ff)' }}
        >
          {activeItems.length > 0 ? 'Your Next Moves' : 'Activity'}
        </h2>

        {/* Active activity cards */}
        {activeItems.map((item) => (
          <ActivityCard key={item.id} item={item} fontClass={fontClass} />
        ))}

        {/* Completed items — composted style */}
        {completedItems.length > 0 && (
          <>
            <h3
              className="text-xs font-medium uppercase tracking-wider mt-6 mb-2"
              style={{ color: 'var(--cs-text-muted, #6060a0)' }}
            >
              Completed
            </h3>
            {completedItems.map((item) => (
              <ActivityCard
                key={item.id}
                item={item}
                fontClass={fontClass}
                composted
              />
            ))}
          </>
        )}

        {/* Story bridge — game ↔ real-world connection */}
        {data.campaign.storyBridgeCopy && (
          <section
            className="mt-8 border-t pt-6"
            style={{ borderColor: 'var(--cs-border, rgba(200, 160, 255, 0.15))' }}
          >
            <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--cs-text-muted,#6060a0)] italic">
              {data.campaign.storyBridgeCopy}
            </div>
          </section>
        )}
      </main>

      {/* ── Footer navigation (thumb-first: nav in bottom zone) ─────────── */}
      <footer className="px-6 sm:px-10 py-6 max-w-2xl mx-auto w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Primary: Campaign Hub */}
          <Link
            href={`/campaign/hub?ref=${encodeURIComponent(data.campaign.slug)}`}
            className="flex-1 text-center py-3 px-6 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'var(--cs-cta-bg, #f0d000)',
              color: 'var(--cs-cta-text, #12124a)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            Campaign Hub
          </Link>

          {/* Secondary: Campaign landing */}
          <Link
            href={`/campaign/${encodeURIComponent(data.campaign.slug)}`}
            className="py-3 px-5 rounded-xl text-sm font-medium transition-colors text-center"
            style={{
              background: 'var(--cs-cta-secondary-bg, rgba(200, 160, 255, 0.15))',
              color: 'var(--cs-cta-secondary-text, #c8a0ff)',
              border: '1px solid var(--cs-cta-secondary-border, rgba(200, 160, 255, 0.4))',
            }}
          >
            Campaign Page
          </Link>
        </div>

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

// ─── Activity Card ──────────────────────────────────────────────────────────

/**
 * Single activity card following three-channel encoding:
 *   Channel 1 (Element): border + glow color from item.element
 *   Channel 2 (Altitude): active items get 2px border + glow; completed get 1px dim
 *   Channel 3 (Stage): active = "growing" density; completed = "composted" opacity
 */
function ActivityCard({
  item,
  fontClass,
  composted = false,
}: {
  item: CampaignHomeActivityItem
  fontClass: string
  composted?: boolean
}) {
  const element = ELEMENT_COLORS[item.element] ?? ELEMENT_COLORS.wood
  const icon = TYPE_ICONS[item.type] ?? '✦'

  // Three-channel encoding
  const borderWidth = composted ? '1px' : '2px'
  const borderOpacity = composted ? 0.3 : 0.7
  const glowRadius = composted ? '0px' : '4px'
  const cardOpacity = composted ? 0.5 : 1

  return (
    <Link
      href={item.href}
      className="group block rounded-xl p-4 transition-all hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: 'var(--cs-surface, rgba(10, 10, 40, 0.6))',
        border: `${borderWidth} solid rgba(${hexToRgb(element.frame)}, ${borderOpacity})`,
        boxShadow: composted
          ? 'none'
          : `0 0 ${glowRadius} rgba(${hexToRgb(element.glow)}, 0.15)`,
        opacity: cardOpacity,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span
          className="text-lg flex-shrink-0 mt-0.5"
          role="img"
          aria-hidden="true"
        >
          {composted ? '✓' : icon}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-bold leading-snug ${fontClass} group-hover:underline`}
            style={{ color: composted ? 'var(--cs-text-muted, #6060a0)' : element.glow }}
          >
            {item.title}
          </h3>
          <p
            className="mt-1 text-xs leading-relaxed line-clamp-2"
            style={{
              color: composted
                ? 'var(--cs-text-muted, #6060a0)'
                : 'var(--cs-text-secondary, #9090c0)',
            }}
          >
            {item.description}
          </p>
        </div>

        {/* Arrow indicator */}
        {!composted && (
          <span
            className="flex-shrink-0 text-sm opacity-40 group-hover:opacity-80 transition-opacity mt-1"
            style={{ color: element.glow }}
          >
            →
          </span>
        )}
      </div>
    </Link>
  )
}

// ─── Utility ────────────────────────────────────────────────────────────────

/** Convert hex color (#RRGGBB) to comma-separated RGB for use in rgba() */
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r}, ${g}, ${b}`
}
