'use client'

/**
 * SuperpowerReveal — the discovery result surface (campaign Phase 2, FR7;
 * quiz-design Phase 3, FR7/T3.2; superpower-route design handoff).
 *
 * Renders a scored result as a lens, not a verdict, in the dark "OS that
 * contains cards" language:
 *   a. primary card — element-coded (arc anchor, ADR 0002) with a floating
 *      Wuxing sigil gem, the gift, and the shadow / at-best rows;
 *   b. margin band — how close the runner-up sits;
 *   c. Aligned Action bridge — the reserved liminal-purple treatment that routes
 *      the taker from *finding* their superpower to *making one concrete move* in
 *      The Crossing (their superpower lens on the campaign + a matched role move);
 *   d. full spectrum — all seven ranked, so the result reads as a position;
 *   e. framing note — lens, not verdict; the taker is the authority.
 *
 * NO email gate. All element color flows through --bars-* tokens (scoped via
 * data-element). The liminal-purple action ramp is the reserved non-element
 * action hue (see bars-tokens.css). UI_COVENANT: layout only in Tailwind/inline.
 */
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { SUPERPOWER_DEFS } from '@/lib/superpowers/types'
import { SUPERPOWER_TRANSLATION } from '@/lib/superpowers/matrix'
import {
  CROSSING_PATH,
  crossingRoleHref,
  superpowerNation,
  superpowerSigil,
  superpowerElement,
  THE_CROSSING_HREF,
} from '@/lib/superpowers/crossing-path'
import type { SuperpowerRoutingResult } from '@/lib/superpowers/routing'
import type { ResultCopy } from '@/lib/superpowers/quiz/descriptions'

export interface SuperpowerRevealProps {
  routing: SuperpowerRoutingResult
  copy: ResultCopy
}

const ORIENTATION_LABEL = {
  internal: 'Internal — self-allyship',
  external: 'External — world-facing allyship',
} as const

const MONO: CSSProperties = { fontFamily: 'var(--bars-font-mono)' }
const DISPLAY: CSSProperties = { fontFamily: 'var(--bars-font-display)' }
const BODY: CSSProperties = { fontFamily: 'var(--bars-font-body)' }

// Reserved liminal-purple action ramp (non-element; see bars-tokens.css).
const PURPLE = { lite: '#a78bfa', chip: '#b794f6', deep: '#7c3aed', mid: '#8b5cf6', outline: '#cdbff5' }

export function SuperpowerReveal({ routing, copy }: SuperpowerRevealProps) {
  const primary = routing.superpower
  const primaryDef = SUPERPOWER_DEFS[primary]
  const secondaryDef = SUPERPOWER_DEFS[routing.secondary]
  const element = superpowerElement(primary)

  // The Aligned Action lens uses the chosen orientation; fall back to the
  // world-facing lens when the orientation item was skipped.
  const orientation = routing.orientation ?? 'external'
  const cell = SUPERPOWER_TRANSLATION[primary][orientation]
  const path = CROSSING_PATH[primary]

  const marginWidth = `${Math.max(6, Math.min(100, copy.marginPct))}%`

  return (
    <div className="flex flex-col gap-[18px]">
      <span
        className="text-[10px] uppercase"
        style={{ ...MONO, letterSpacing: '.26em', color: 'var(--bars-text-secondary)' }}
      >
        Your reading · primary lens
      </span>

      {/* a. Primary card — element-coded (arc anchor). altitude ≈ satisfied. */}
      <div
        data-element={element}
        className="relative overflow-hidden rounded-[14px] p-5"
        style={{
          background: 'var(--bars-surface-card)',
          boxShadow:
            'inset 0 1px 0 var(--bars-inset-top), 0 0 0 2px var(--bars-element-frame), 0 0 28px -6px var(--bars-element-glow)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 88% -10%, color-mix(in srgb, var(--bars-element-glow) 16%, transparent) 0%, transparent 56%)',
          }}
        />
        <div className="relative flex flex-col gap-[14px]">
          <div className="flex items-start justify-between gap-[14px]">
            <div className="flex min-w-0 flex-col gap-[7px]">
              <span
                className="text-[9.5px] uppercase"
                style={{ ...MONO, letterSpacing: '.2em', color: 'var(--bars-element-gem)' }}
              >
                {superpowerNation(primary)}
              </span>
              <h2
                className="text-[30px] font-bold"
                style={{ ...DISPLAY, letterSpacing: '-.02em', lineHeight: 1, color: 'var(--bars-text-primary)' }}
              >
                {primaryDef.label}
              </h2>
              {routing.orientation ? (
                <span
                  className="text-[9px] uppercase"
                  style={{ ...MONO, letterSpacing: '.12em', color: 'var(--bars-text-secondary)' }}
                >
                  {ORIENTATION_LABEL[routing.orientation]}
                </span>
              ) : null}
            </div>
            <span
              aria-hidden
              className="sp-float inline-flex h-[50px] w-[50px] flex-none items-center justify-center rounded-[14px] text-[24px]"
              style={{
                color: 'var(--bars-element-gem)',
                background: 'color-mix(in srgb, var(--bars-element-frame) 22%, var(--bars-surface-inset))',
                boxShadow:
                  'inset 0 0 0 1px color-mix(in srgb, var(--bars-element-frame) 60%, transparent), 0 0 18px -4px var(--bars-element-glow)',
                textShadow: '0 0 12px var(--bars-element-glow)',
              }}
            >
              {superpowerSigil(primary)}
            </span>
          </div>

          <p
            className="text-[14.5px]"
            style={{ ...BODY, lineHeight: 1.6, color: 'var(--bars-text-primary)' }}
          >
            {copy.primary.gift}
          </p>

          <div
            className="flex flex-col gap-[9px] pt-[13px]"
            style={{ borderTop: '1px solid var(--bars-line)' }}
          >
            <ProseRow label="Shadow">{copy.primary.shadow}</ProseRow>
            <ProseRow label="At best">{copy.primary.atBest}</ProseRow>
          </div>
        </div>
      </div>

      {/* b. Margin band + secondary */}
      <div
        className="flex flex-col gap-[9px] rounded-xl px-4 py-[15px]"
        style={{ background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
      >
        <div
          className="flex items-baseline justify-between text-[10px] uppercase"
          style={{ ...MONO, letterSpacing: '.1em' }}
        >
          <span style={{ color: 'var(--bars-text-primary)' }}>{primaryDef.label}</span>
          <span style={{ color: 'var(--bars-text-muted)' }}>{secondaryDef.label}</span>
        </div>
        <div
          className="h-[6px] w-full overflow-hidden rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          role="img"
          aria-label={`${primaryDef.label} leads by ${copy.marginPct} percent`}
        >
          <span
            data-element={element}
            className="block h-full rounded-full"
            style={{
              width: marginWidth,
              background: 'var(--bars-element-gem)',
              boxShadow: '0 0 8px -1px var(--bars-element-glow)',
              transition: 'width .6s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </div>
        <p className="text-[13px]" style={{ ...BODY, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
          {copy.tryAdjacent}
        </p>
        {!routing.confident ? (
          <p className="text-[12px]" style={{ ...BODY, lineHeight: 1.5, color: 'var(--bars-text-muted)' }}>
            These two are close — you may carry both. Read each and choose for yourself.
          </p>
        ) : null}
      </div>

      {/* c. Aligned Action bridge — reserved liminal-purple action treatment. */}
      <div className="flex flex-col gap-[11px]">
        <span
          className="text-[10px] uppercase"
          style={{ ...MONO, letterSpacing: '.24em', color: 'var(--bars-liminal-glow)' }}
        >
          Move into aligned action · live
        </span>

        <div
          className="relative overflow-hidden rounded-2xl px-[18px] pb-[18px] pt-[19px]"
          style={{
            background: 'linear-gradient(168deg, #16111f 0%, #111110 52%)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(124,58,237,0.30), 0 0 34px -10px rgba(124,58,237,0.55)',
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(120% 80% at 90% -12%, rgba(124,58,237,0.22) 0%, transparent 55%)' }}
          />
          <div className="relative flex flex-col gap-[14px]">
            <div className="flex flex-col gap-[6px]">
              <span
                className="text-[9.5px] uppercase"
                style={{ ...MONO, letterSpacing: '.16em', color: PURPLE.lite }}
              >
                ◇ The Allyship Launch · Barn Raising
              </span>
              <h3
                className="text-[25px] font-bold"
                style={{ ...DISPLAY, letterSpacing: '-.02em', lineHeight: 1, color: '#f4f2ec' }}
              >
                The Crossing
              </h3>
              <p
                className="text-[13.5px]"
                style={{ ...BODY, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}
              >
                Wendell needs a reliable car to keep showing up. Every superpower has a way in.
              </p>
            </div>

            {/* Your lens on this campaign */}
            <div
              className="flex flex-col gap-[8px] rounded-xl px-[14px] py-[13px]"
              style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)' }}
            >
              <span
                className="text-[9px] uppercase"
                style={{ ...MONO, letterSpacing: '.14em', color: PURPLE.lite }}
              >
                Your {primaryDef.label} lens · {orientation === 'internal' ? 'self-allyship' : 'world-facing'}
              </span>
              <p
                className="text-[16px] font-semibold"
                style={{ ...DISPLAY, lineHeight: 1.32, letterSpacing: '-.01em', color: 'var(--bars-text-primary)' }}
              >
                {cell.prompt}
              </p>
              <p
                className="text-[12.5px]"
                style={{ ...BODY, lineHeight: 1.45, color: 'var(--bars-text-secondary)' }}
              >
                <span
                  className="mr-[6px] text-[8.5px] uppercase"
                  style={{ ...MONO, letterSpacing: '.14em', color: 'var(--bars-text-muted)' }}
                >
                  Make
                </span>
                {cell.suggestedArtifact}
              </p>
            </div>

            {/* Matched move */}
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="inline-flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] text-center text-[9px] font-bold uppercase"
                style={{
                  ...MONO,
                  letterSpacing: '.02em',
                  lineHeight: 1.05,
                  color: '#0a0908',
                  background: `linear-gradient(150deg, ${PURPLE.chip}, ${PURPLE.deep})`,
                  boxShadow: '0 8px 18px -10px #7c3aed',
                }}
              >
                {path.abbr}
              </span>
              <div className="flex min-w-0 flex-col gap-[3px]">
                <span
                  className="text-[9px] uppercase"
                  style={{ ...MONO, letterSpacing: '.14em', color: 'var(--bars-text-muted)' }}
                >
                  Your path · {path.roleLabel}
                </span>
                <span
                  className="text-[13.5px] font-semibold"
                  style={{ ...BODY, lineHeight: 1.42, color: 'var(--bars-text-primary)' }}
                >
                  {path.move}
                </span>
              </div>
            </div>

            <div className="mt-[2px] flex flex-wrap gap-[10px]">
              <Link
                href={crossingRoleHref(path.roleId)}
                className="min-w-[170px] flex-1 rounded-[11px] px-4 py-3 text-center text-[14px] font-semibold no-underline"
                style={{
                  ...DISPLAY,
                  color: '#fff',
                  background: `linear-gradient(150deg, ${PURPLE.mid}, ${PURPLE.deep})`,
                  boxShadow: '0 10px 26px -12px #7c3aed, inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
              >
                Take this move in The Crossing →
              </Link>
              <Link
                href={THE_CROSSING_HREF}
                className="flex-none rounded-[11px] px-4 py-3 text-center text-[14px] font-semibold no-underline"
                style={{
                  ...DISPLAY,
                  color: PURPLE.outline,
                  background: 'transparent',
                  border: '1px solid rgba(124,58,237,0.42)',
                }}
              >
                See all paths
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* d. Full spectrum — all seven ranked. */}
      <details
        className="overflow-hidden rounded-xl"
        style={{ background: 'var(--bars-surface-card)', boxShadow: 'inset 0 1px 0 var(--bars-inset-top), 0 0 0 1px var(--bars-line)' }}
      >
        <summary
          className="cursor-pointer list-none px-4 py-[14px] text-[10px] uppercase"
          style={{ ...MONO, letterSpacing: '.16em', color: 'var(--bars-text-secondary)' }}
        >
          See your full spectrum ▾
        </summary>
        <div className="flex flex-col gap-[11px] px-4 pb-[17px] pt-[2px]">
          {routing.ranked.map((r) => {
            const pctStr = `${Math.round(r.pct * 100)}%`
            return (
              <div key={r.superpower} data-element={superpowerElement(r.superpower)} className="flex items-center gap-[11px]">
                <span
                  className="w-24 flex-none text-[13px] font-medium"
                  style={{ ...DISPLAY, color: 'var(--bars-text-primary)' }}
                >
                  {SUPERPOWER_DEFS[r.superpower].label}
                </span>
                <span
                  className="h-[5px] flex-1 overflow-hidden rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                  aria-hidden
                >
                  <span
                    className="block h-full rounded-full"
                    style={{ width: pctStr, background: 'var(--bars-element-gem)', opacity: 0.85 }}
                  />
                </span>
                <span
                  className="w-[34px] flex-none text-right text-[10px] tabular-nums"
                  style={{ ...MONO, color: 'var(--bars-text-secondary)' }}
                >
                  {pctStr}
                </span>
              </div>
            )
          })}
        </div>
      </details>

      {/* e. Framing — lens, not verdict. */}
      <p className="text-[12px]" style={{ ...BODY, lineHeight: 1.6, color: 'var(--bars-text-muted)' }}>
        {copy.framing}
      </p>
    </div>
  )
}

/** A mono uppercase inline label (element-gem) followed by body prose. */
function ProseRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="text-[13px]" style={{ ...BODY, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
      <span
        className="mr-[6px] text-[9.5px] uppercase"
        style={{ ...MONO, letterSpacing: '.14em', color: 'var(--bars-element-gem)' }}
      >
        {label}
      </span>
      {children}
    </p>
  )
}
