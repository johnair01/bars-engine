'use client'

import { useMemo } from 'react'
import { buildSkinVars, resolveFontClass, type ThemeData } from '@/lib/ui/build-skin-vars'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CampaignThemePreviewProps = {
  theme: ThemeData
  campaignName: string
  campaignDescription?: string
}

// ---------------------------------------------------------------------------
// Component — Live preview of campaign skin
// ---------------------------------------------------------------------------

/**
 * Live preview panel showing how the campaign landing/share page will look.
 *
 * Renders a miniature campaign page mock-up using the buildSkinVars pipeline,
 * so the preview is pixel-accurate to the real campaign rendering.
 */
export function CampaignThemePreview({
  theme,
  campaignName,
  campaignDescription,
}: CampaignThemePreviewProps) {
  // Build CSS vars from theme data (no static skin — preview shows DB theme only)
  const cssProperties = useMemo(() => buildSkinVars(theme, null), [theme])
  const fontClass = useMemo(() => resolveFontClass(theme, null), [theme])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          Live Preview
        </h3>
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
          Campaign Landing
        </span>
      </div>

      {/* Preview frame */}
      <div
        className="rounded-xl border border-zinc-800 overflow-hidden"
        style={{
          ...cssProperties,
          background:
            (theme.bgGradient as string) ??
            'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
        }}
      >
        {/* Simulated campaign header */}
        <div className="px-5 pt-6 pb-4 space-y-3">
          {/* Nav bar mock */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded"
                style={{
                  backgroundColor: theme.accentPrimary ?? '#6366f1',
                  opacity: 0.6,
                }}
              />
              <span
                className="text-[10px] uppercase tracking-widest"
                style={{ color: theme.textMuted ?? '#6b7280' }}
              >
                Campaign
              </span>
            </div>
            <div
              className="px-2 py-0.5 rounded text-[8px] font-bold uppercase"
              style={{
                backgroundColor: theme.ctaBg ?? '#6366f1',
                color: theme.ctaText ?? '#ffffff',
              }}
            >
              Join
            </div>
          </div>

          {/* Title */}
          <h2
            className={`text-lg font-bold leading-tight ${fontClass}`}
            style={{
              color: theme.titleColor ?? '#e8e6e0',
              fontSize: fontClass.includes('pixel') ? '12px' : undefined,
            }}
          >
            {campaignName || 'Campaign Name'}
          </h2>

          {/* Description */}
          <p
            className="text-xs leading-relaxed"
            style={{ color: theme.textSecondary ?? '#9ca3af' }}
          >
            {campaignDescription ??
              'A campaign bringing people together to make a difference through collective action and shared purpose.'}
          </p>
        </div>

        {/* Content cards mock */}
        <div className="px-5 pb-5 space-y-3">
          {/* Quest card */}
          <div
            className="rounded-lg p-3 space-y-2"
            style={{
              backgroundColor: theme.surfaceColor ?? 'rgba(15, 15, 35, 0.6)',
              border: `1px solid ${theme.borderColor ?? 'rgba(99, 102, 241, 0.15)'}`,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: theme.greenAccent ?? '#4ade80' }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: theme.textPrimary ?? '#e8e6e0' }}
              >
                First Quest
              </span>
            </div>
            <p
              className="text-[10px] leading-relaxed"
              style={{ color: theme.textMuted ?? '#6b7280' }}
            >
              Complete this quest to unlock the next stage of your journey.
            </p>
            <div className="flex items-center gap-2">
              <div
                className="h-1 flex-1 rounded-full overflow-hidden"
                style={{ backgroundColor: `${theme.borderColor ?? 'rgba(99, 102, 241, 0.15)'}` }}
              >
                <div
                  className="h-full rounded-full w-1/3"
                  style={{ backgroundColor: theme.accentPrimary ?? '#6366f1' }}
                />
              </div>
              <span
                className="text-[9px] tabular-nums"
                style={{ color: theme.textMuted ?? '#6b7280' }}
              >
                33%
              </span>
            </div>
          </div>

          {/* Milestone strip mock */}
          <div
            className="rounded-lg p-3 flex items-center gap-3"
            style={{
              backgroundColor: theme.surfaceColor ?? 'rgba(15, 15, 35, 0.6)',
              border: `1px solid ${theme.borderColor ?? 'rgba(99, 102, 241, 0.15)'}`,
            }}
          >
            {[
              { color: theme.accentPrimary ?? '#6366f1', filled: true },
              { color: theme.accentSecondary ?? '#8b5cf6', filled: true },
              { color: theme.accentTertiary ?? '#ec4899', filled: false },
            ].map((dot, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: dot.filled ? dot.color : 'transparent',
                    border: `1.5px solid ${dot.color}`,
                    opacity: dot.filled ? 1 : 0.4,
                  }}
                />
                <div
                  className="w-8 h-px"
                  style={{
                    backgroundColor: theme.borderColor ?? 'rgba(99, 102, 241, 0.15)',
                    display: i < 2 ? 'block' : 'none',
                  }}
                />
              </div>
            ))}
          </div>

          {/* CTA buttons mock */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
              style={{
                backgroundColor: theme.ctaBg ?? '#6366f1',
                color: theme.ctaText ?? '#ffffff',
              }}
            >
              Join Campaign
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-[10px] font-medium border"
              style={{
                backgroundColor: 'transparent',
                color: theme.accentPrimary ?? '#6366f1',
                borderColor: `${theme.accentPrimary ?? '#6366f1'}40`,
              }}
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Color swatches summary */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {[
          { label: 'Title', color: theme.titleColor },
          { label: 'Accent 1', color: theme.accentPrimary },
          { label: 'Accent 2', color: theme.accentSecondary },
          { label: 'Accent 3', color: theme.accentTertiary },
          { label: 'CTA', color: theme.ctaBg },
          { label: 'Green', color: theme.greenAccent },
        ]
          .filter((s) => s.color)
          .map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900/50 border border-zinc-800"
            >
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: s.color ?? undefined }}
              />
              <span className="text-[9px] text-zinc-500">{s.label}</span>
            </div>
          ))}
      </div>
    </div>
  )
}
