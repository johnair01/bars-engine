'use client'

import type { CSSProperties, ReactNode } from 'react'

import { askingLine } from '@/lib/mtgoa-course/course-days'
import type { MtgoaCourseDay } from '@/lib/mtgoa-course/course-days'

import styles from './CheckKit.module.css'

/**
 * The shared shell and primitives for an MTGOA course-day check.
 *
 * Days 2 and 3 shipped as two standalone components, each with its own private
 * copy of Step / StepFooter / PrimaryButton / Chip / SelectRow. That is fine at
 * two and untenable at thirty, so the pieces every day needs live here once and
 * the day supplies only what is actually its own: the element accent, the
 * chrome label, and its screens.
 *
 * The element comes from the move, never the domain — Wake Up earth, Open Up
 * liminal, Clean Up water, Grow Up wood, Show Up fire. A day passes its accent
 * in; `CheckShell` publishes it as `--check-accent` so the focus rings and the
 * progress bar in the stylesheet pick it up without another prop.
 *
 * Purple `--bars-liminal` stays the reserved primary-action / selection color in
 * every day, including the day whose own element is liminal.
 *
 * @see src/lib/mtgoa-course/course-days.ts
 */

export const mono: CSSProperties = { fontFamily: 'var(--bars-font-mono)' }
export const display: CSSProperties = { fontFamily: 'var(--bars-font-display)' }

/** Per-day element channel. `lift` is the glow raised for legibility at the 10px mono label size. */
export type CheckAccent = { base: string; lift: string }

/**
 * Page frame: background, measure, the chrome label row and the progress bar.
 * `steps`/`index` drive the bar; a day that has no linear order can omit both.
 */
export function CheckShell({
  label,
  moveTag,
  accent,
  steps,
  index,
  children,
}: {
  /** Left chrome label, e.g. "Wake Up Check". Gold, constant across the flow. */
  label: string
  /** Right chrome label, e.g. "wake up · 土". */
  moveTag: string
  accent: CheckAccent
  steps?: number
  index?: number
  children: ReactNode
}) {
  const progress =
    steps && steps > 0 && typeof index === 'number'
      ? Math.round(((index + 1) / steps) * 100)
      : null

  return (
    <main
      className={styles.root}
      style={{ ['--check-accent' as string]: accent.base, ['--check-accent-lift' as string]: accent.lift }}
    >
      <div className={styles.page}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingBottom: 12 }}>
          <span className="bars-label" style={{ color: 'var(--bars-gold)' }}>{label}</span>
          <span className="bars-label" style={{ color: accent.lift }}>{moveTag}</span>
        </div>
        {progress === null ? null : (
          <div
            role="progressbar"
            aria-label={`${label} progress`}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ height: 2, borderRadius: 2, background: 'var(--bars-line)', overflow: 'hidden' }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: `linear-gradient(to right, ${accent.base}, var(--bars-liminal))`,
                transition: 'width .35s var(--bars-ease-out)',
              }}
            />
          </div>
        )}
        {children}
      </div>
    </main>
  )
}

/** One screen. Never scrollIntoView — a step change returns to the top of the page. */
export function Step({ children }: { children: ReactNode }) {
  return <div className={styles.fadeup} style={{ paddingTop: 34 }}>{children}</div>
}

export function StepEyebrow({ children, color = 'var(--bars-text-muted)' }: { children: ReactNode; color?: string }) {
  return <span className="bars-label" style={{ display: 'block', color }}>{children}</span>
}

export function StepTitle({ children, size = 26 }: { children: ReactNode; size?: number }) {
  return (
    <h2 className="bars-title" style={{ margin: '10px 0 0', fontSize: size, lineHeight: 1.22, textWrap: 'pretty' }}>
      {children}
    </h2>
  )
}

export function StepBody({ children, top = 10 }: { children: ReactNode; top?: number }) {
  return (
    <p
      className="bars-prose"
      style={{ margin: `${top}px 0 0`, fontSize: 17, lineHeight: 1.6, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}
    >
      {children}
    </p>
  )
}

export function PrivacyLine({ children, align = 'center' }: { children: ReactNode; align?: 'center' | 'left' }) {
  return (
    <p
      style={{
        margin: align === 'center' ? '18px 0 0' : '14px 0 0',
        textAlign: align,
        ...mono,
        fontSize: 'var(--bars-text-2xs)',
        color: 'var(--bars-text-muted)',
        letterSpacing: '.06em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </p>
  )
}

export function NumBadge({ num, color = 'var(--bars-text-secondary)' }: { num: string; color?: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        flex: 'none',
        borderRadius: 10,
        ...display,
        fontWeight: 700,
        fontSize: 16,
        color,
        background: `color-mix(in srgb, ${color} 13%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
      }}
    >
      {num}
    </span>
  )
}

export function StepFooter({ back, next }: { back: () => void; next: { label: string; onClick: () => void } }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 26 }}>
      <BackLink onClick={back} />
      <PrimaryButton onClick={next.onClick}>{next.label}</PrimaryButton>
    </div>
  )
}

export function BackLink({ onClick }: { onClick: () => void }) {
  return <TextButton onClick={onClick}>← back</TextButton>
}

export function TextButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={styles.clk}
      onClick={onClick}
      style={{
        color: 'var(--bars-text-secondary)',
        fontSize: 'var(--bars-text-sm)',
        fontFamily: 'var(--bars-font-body)',
        padding: '12px 8px',
        background: 'none',
        border: 'none',
        minHeight: 44,
      }}
    >
      {children}
    </button>
  )
}

export function PrimaryButton({
  onClick,
  children,
  block,
  glow,
  compact,
}: {
  onClick: () => void
  children: ReactNode
  block?: boolean
  glow?: boolean
  compact?: boolean
}) {
  return (
    <button
      type="button"
      className={`${styles.clk} ${styles.press}`}
      onClick={onClick}
      style={{
        ...display,
        fontWeight: 700,
        fontSize: block ? 16 : compact ? 14 : 15,
        color: '#fff',
        background: 'var(--bars-liminal)',
        padding: block ? 16 : compact ? '11px 20px' : '13px 26px',
        minHeight: 44,
        width: block ? '100%' : undefined,
        textAlign: 'center',
        borderRadius: 'var(--bars-radius-lg)',
        border: 'none',
        flex: compact ? 'none' : undefined,
        whiteSpace: compact ? 'nowrap' : undefined,
        textWrap: compact ? undefined : 'pretty',
        boxShadow: glow
          ? 'var(--bars-shadow-inset-top), 0 10px 24px -10px var(--bars-liminal)'
          : 'var(--bars-shadow-inset-top)',
      }}
    >
      {children}
    </button>
  )
}

export function OutlineButton({
  onClick,
  children,
  block,
  strong,
}: {
  onClick: () => void
  children: ReactNode
  block?: boolean
  strong?: boolean
}) {
  return (
    <button
      type="button"
      className={`${styles.clk} ${styles.press}`}
      onClick={onClick}
      style={{
        ...display,
        fontWeight: 600,
        fontSize: block ? 15 : 14,
        color: strong ? 'var(--bars-text-primary)' : 'var(--bars-text-secondary)',
        background: 'none',
        padding: block ? 15 : '13px 18px',
        minHeight: 44,
        width: block ? '100%' : undefined,
        textAlign: 'center',
        borderRadius: 'var(--bars-radius-lg)',
        border: `1px solid ${strong ? 'var(--bars-line-strong)' : 'var(--bars-line)'}`,
        textWrap: 'pretty',
      }}
    >
      {children}
    </button>
  )
}

export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`${styles.clk} ${styles.press}`}
      aria-pressed={selected}
      onClick={onClick}
      style={{
        ...mono,
        fontSize: 13,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        padding: '14px 18px',
        minHeight: 44,
        borderRadius: 'var(--bars-radius-full)',
        color: selected ? '#fff' : 'var(--bars-text-primary)',
        background: selected ? 'var(--bars-liminal)' : 'var(--bars-surface-inset)',
        border: `1px solid ${selected ? 'var(--bars-liminal)' : 'var(--bars-line-strong)'}`,
        boxShadow: selected ? 'var(--bars-shadow-inset-top)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

/** A two-line selectable row. 16px of vertical padding — these are never 10px rows. */
export function SelectRow({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`${styles.clk} ${styles.press}`}
      aria-pressed={selected}
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '16px 17px',
        borderRadius: 'var(--bars-radius-lg)',
        background: 'var(--bars-surface-card)',
        border: `1px solid ${selected ? 'var(--bars-liminal)' : 'var(--bars-line-strong)'}`,
        boxShadow: selected
          ? 'var(--bars-shadow-inset-top), 0 0 18px -6px var(--bars-liminal)'
          : 'var(--bars-shadow-inset-top)',
      }}
    >
      {children}
    </button>
  )
}

/** A private free-text field. 16px minimum, and it always says where the text goes. */
export function PrivateField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div style={{ marginTop: 22 }}>
      <label className="bars-label" htmlFor={id} style={{ display: 'block', color: 'var(--bars-text-muted)' }}>
        {label}
      </label>
      <textarea
        id={id}
        className={styles.field}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={{ marginTop: 8, padding: '14px 15px', lineHeight: 1.55 }}
      />
    </div>
  )
}

/** The gold threshold that marks where the deck enters the flow. */
export function DeckRibbon({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 26 }}>
      <span className={styles.ribbonRule} style={{ background: 'var(--bars-gold)', opacity: 0.45 }} />
      <span className={`bars-label ${styles.ribbon}`} style={{ color: 'var(--bars-gold)' }}>{children}</span>
      <span className={styles.ribbonRule} style={{ background: 'var(--bars-gold)', opacity: 0.45 }} />
    </div>
  )
}

/** A labelled receipt line. Renders nothing when the reader left it blank. */
export function ReceiptRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div style={{ marginTop: 16 }}>
      <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>{label}</span>
      <p
        className="bars-prose"
        style={{ margin: '5px 0 0', fontSize: 16, lineHeight: 1.55, color: 'var(--bars-text-primary)', whiteSpace: 'pre-wrap' }}
      >
        {value}
      </p>
    </div>
  )
}

/**
 * The forward handoff on a receipt.
 *
 * Tomorrow's question is always named — a reader should know what the course
 * asks next even when that day is unbuilt. Whether it renders as a link is not
 * this component's decision: it comes from `nextCourseDay()`, which returns
 * `route: null` until the day actually ships. That is what lets every receipt be
 * wired once and never point at a 404.
 *
 * Pass `href` already run through the day's own attribution helper so the course
 * walks as one journey. It is ignored when the next day has no route.
 */
export function NextDayHandoff({
  handoff,
  href,
  onNavigate,
  accent,
}: {
  handoff: { day: MtgoaCourseDay; route: string | null } | null
  href?: string
  onNavigate?: () => void
  accent: string
}) {
  if (!handoff) return null
  const { day, route } = handoff

  return (
    <div style={{ marginTop: 26 }}>
      <StepEyebrow color={accent}>{`tomorrow · Day ${day.number} · ${day.title}`}</StepEyebrow>
      <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 16, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
        {askingLine(day)}
      </p>
      <div style={{ marginTop: 14 }}>
        {route ? (
          <a
            href={href ?? route}
            onClick={onNavigate}
            style={{
              display: 'block',
              textAlign: 'center',
              textDecoration: 'none',
              ...mono,
              fontSize: 13,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: '#fff',
              background: 'var(--bars-liminal)',
              padding: 16,
              borderRadius: 'var(--bars-radius-lg)',
              boxShadow: 'var(--bars-shadow-inset-top)',
            }}
          >
            {`continue to Day ${day.number} →`}
          </a>
        ) : (
          <span
            aria-disabled
            style={{
              display: 'block',
              textAlign: 'center',
              ...mono,
              fontSize: 13,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: 'var(--bars-text-muted)',
              border: '1px dashed var(--bars-line-strong)',
              padding: 16,
              borderRadius: 'var(--bars-radius-lg)',
            }}
          >
            {`Day ${day.number} · coming next`}
          </span>
        )}
      </div>
    </div>
  )
}
