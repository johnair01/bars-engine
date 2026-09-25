'use client'

import { mono } from './CheckKit'
import type { MtgoaOrganizationState } from '@/lib/mtgoa-course/organization-state'
import { NO_OPEN_PARTICIPATION_NOTE } from '@/lib/mtgoa-course/organization-state'

/**
 * The public "what is already happening" panel.
 *
 * Collapsed by default so it informs without taking the top of the page from
 * the practice. Extracted from WeekTwoPractice when Day 9 got its own flow —
 * both render the same panel, and the spec's publication rules are easier to
 * keep true in one place than in two.
 *
 * Controlled on purpose: the caller owns the open state and fires its own
 * analytics, because the permitted event carries the day number.
 *
 * @see src/lib/mtgoa-course/organization-state.ts — the approved facts
 */
export function CampaignStatePanel({
  orgState,
  hasOpenRoute,
  open,
  onToggle,
  onSurfaceClick,
}: {
  orgState: MtgoaOrganizationState
  hasOpenRoute: boolean
  open: boolean
  onToggle: () => void
  onSurfaceClick?: () => void
}) {
  return (
    <div style={{ marginTop: 22, borderTop: '1px solid var(--bars-line)', paddingTop: 18 }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          ...mono, fontSize: 'var(--bars-text-2xs)', letterSpacing: '.08em', textTransform: 'uppercase',
          color: 'var(--bars-gold)', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', minHeight: 44,
        }}
      >
        {open ? '− what is already happening' : '+ what is already happening'}
      </button>

      {open ? (
        <div style={{ marginTop: 10 }}>
          <p className="bars-prose" style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)' }}>
            {orgState.campaignSummary}
          </p>

          <span className="bars-label" style={{ display: 'block', marginTop: 16, color: 'var(--bars-text-muted)' }}>true right now</span>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: 'var(--bars-text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
            {orgState.currentTruths.map((t) => <li key={t}>{t}</li>)}
          </ul>

          <span className="bars-label" style={{ display: 'block', marginTop: 16, color: 'var(--bars-text-muted)' }}>and not true right now</span>
          <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: 'var(--bars-text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
            {orgState.notCurrentlyTrue.map((t) => <li key={t}>{t}</li>)}
          </ul>

          {/* The spec's rule: with nothing approved, say so and send the
              reader to the personal lane. Never invent a vacancy. */}
          {hasOpenRoute ? null : (
            <div
              style={{
                marginTop: 16, padding: 15, borderRadius: 'var(--bars-radius-lg)',
                background: 'var(--bars-surface-card)', border: '1px dashed var(--bars-line-strong)',
              }}
            >
              <p className="bars-prose" style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)' }}>
                {NO_OPEN_PARTICIPATION_NOTE}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
            {orgState.relatedSurfaces.map((s) => (
              <a
                key={s.href}
                href={s.href}
                onClick={onSurfaceClick}
                style={{ ...mono, fontSize: 'var(--bars-text-2xs)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--bars-gold)', textDecoration: 'none' }}
              >
                {s.label} →
              </a>
            ))}
          </div>

          <p style={{ ...mono, margin: '16px 0 0', fontSize: 'var(--bars-text-2xs)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
            last updated {orgState.updatedAt} · next review by {orgState.nextReviewAt}
          </p>
        </div>
      ) : null}
    </div>
  )
}
