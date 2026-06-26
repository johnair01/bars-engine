/**
 * DeckCardForRole — renders one Allyship Deck starter move for a Crossing role,
 * built on the real CultivationCard primitive (not the prototype's AllyshipCard).
 *
 * A move code is `MOVE-DOMAIN-FACE` (e.g. `WAKE-GR-DIPLOMAT`). We parse it for
 * the move / domain / face labels and a contemplative question, tint the card to
 * the role's element (element tint follows the role everywhere it appears), and
 * show a signed-out "Sign in to claim" action bar on public pages.
 *
 * No deck-move registry is required: labels + question derive from the code.
 * UI_COVENANT: color via card-tokens; layout via Tailwind.
 */

import Link from 'next/link'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'
import type { TheCrossingSupportRole } from '@/lib/the-crossing-support-moves'

const MOVE_LABELS: Record<string, string> = {
  WAKE: 'Wake Up',
  OPEN: 'Open Up',
  CLEAN: 'Clean Up',
  GROW: 'Grow Up',
  SHOW: 'Show Up',
}

const DOMAIN_LABELS: Record<string, string> = {
  GR: 'Gather Resources',
  SO: 'Skillful Organizing',
  RA: 'Raise Awareness',
  DA: 'Direct Action',
}

const FACE_LABELS: Record<string, string> = {
  ARCHITECT: 'Architect',
  DIPLOMAT: 'Diplomat',
  REGENT: 'Regent',
  CHALLENGER: 'Challenger',
  SAGE: 'Sage',
  SHAMAN: 'Shaman',
}

const QUESTION_BY_MOVE: Record<string, string> = {
  WAKE: 'What is here that you have not let yourself see yet?',
  OPEN: 'What becomes possible if you receive instead of grip?',
  CLEAN: 'What charge is asking to be metabolized before you move?',
  GROW: 'Which capacity wants to stretch one notch further?',
  SHOW: 'What is the smallest move that makes this real?',
}

export type ParsedDeckCode = {
  code: string
  move: string
  moveLabel: string
  domain: string
  domainLabel: string
  face: string
  faceLabel: string
  question: string
}

/** Parse a `MOVE-DOMAIN-FACE` deck code into display parts. */
export function parseDeckCode(code: string): ParsedDeckCode {
  const [move = '', domain = '', face = ''] = code.toUpperCase().split('-')
  return {
    code,
    move,
    moveLabel: MOVE_LABELS[move] ?? move,
    domain,
    domainLabel: DOMAIN_LABELS[domain] ?? domain,
    face,
    faceLabel: FACE_LABELS[face] ?? face,
    question: QUESTION_BY_MOVE[move] ?? 'What wants to happen next?',
  }
}

export function DeckCardForRole({
  code,
  element,
  role,
  showActionBar = true,
}: {
  code: string
  element: ElementKey
  role: TheCrossingSupportRole
  /** Render the signed-out claim bar (public deck preview). */
  showActionBar?: boolean
}) {
  const parsed = parseDeckCode(code)
  const tokens = ELEMENT_TOKENS[element]

  return (
    <CultivationCard
      element={element}
      altitude="neutral"
      stage="growing"
      className="rounded-2xl p-4"
      aria-label={`${parsed.moveLabel} · ${parsed.faceLabel} — ${role.label} starter card`}
    >
      {/* Move + face row */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.14em]"
          style={{ color: tokens.gem }}
        >
          {parsed.moveLabel} · {parsed.faceLabel}
        </span>
        <span aria-hidden className="text-base leading-none" style={{ color: tokens.gem }}>
          {tokens.sigil}
        </span>
      </div>

      {/* Title = the code */}
      <h4 className="mt-2 font-semibold tracking-tight text-[var(--cs-card-title,#f4f2ec)]">
        {parsed.code}
      </h4>

      {/* Contemplative question */}
      <p className="mt-1 text-[13px] italic leading-snug text-[#cfcdc6]">{parsed.question}</p>

      {/* Modifier box: the role's contribution + the artifact it makes */}
      <div
        className="mt-3 rounded-lg p-3"
        style={{ background: `${tokens.gem}1a`, border: `1px solid ${tokens.gem}47` }}
      >
        <p className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: tokens.gem }}>
          Modifier · {role.label}
        </p>
        <p className="mt-1 text-[13px] font-semibold text-[var(--cs-card-title,#f4f2ec)]">
          {role.tinyMove}
        </p>
        <p className="mt-0.5 text-[11px] text-[#a09e98]">Make: {role.artifact}</p>
      </div>

      {/* Footer: domain · collector number placeholder */}
      <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b6965]">
        <span>{parsed.domainLabel}</span>
        <span aria-hidden style={{ color: tokens.gem }}>
          ♦
        </span>
      </div>

      {/* Signed-out action bar */}
      {showActionBar ? (
        <Link
          href={`/login?returnTo=${encodeURIComponent('/campaign/the-crossing')}`}
          className="mt-3 block rounded-lg border border-dashed py-2 text-center text-xs font-semibold text-[#a09e98] transition-colors hover:text-[var(--cs-card-title,#f4f2ec)]"
          style={{ borderColor: `${tokens.gem}55` }}
        >
          Sign in to claim
        </Link>
      ) : null}
    </CultivationCard>
  )
}
