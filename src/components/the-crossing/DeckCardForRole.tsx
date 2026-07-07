/**
 * DeckCardForRole — renders one Allyship Deck starter move for a Crossing role,
 * built on the real CultivationCard primitive (not the prototype's AllyshipCard).
 *
 * A move code is the canonical card id (`MOVE-DOMAIN-FACE`, e.g. `WAKE-GR-DIPLOMAT`).
 * We read the real card from the canonical deck library — title, question, and the
 * practice all come from `move-library.ts` via `getMoveCardById`, so this surface can
 * never drift from the deck. We tint to the role's element (element tint follows the
 * role everywhere it appears) and show a signed-out "Sign in to claim" action bar on
 * public pages.
 *
 * UI_COVENANT: color via card-tokens; layout via Tailwind.
 */

import Link from 'next/link'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'
import { getMoveCardById } from '@/lib/allyship-deck/assemble'
import { MOVE_LABELS, OPERATION_LABELS, DOMAIN_LABELS } from '@/lib/allyship-deck/card-visuals'
import type { TheCrossingSupportRole } from '@/lib/the-crossing-support-moves'

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
  const tokens = ELEMENT_TOKENS[element]
  const card = getMoveCardById(code)

  // Canonical card data when resolvable; graceful degrade so a bad id never
  // crashes a statically-generated role page.
  const moveFace = card
    ? `${MOVE_LABELS[card.move]} · ${OPERATION_LABELS[card.operation]}`
    : code
  const title = card?.title ?? code
  const question = card?.primaryQuestion ?? 'What is the smallest move that makes this real?'
  const practice = card?.remediation ?? card?.optimizesFor ?? null
  const domainText = card ? DOMAIN_LABELS[card.domain] : ''

  return (
    <CultivationCard
      element={element}
      altitude="neutral"
      stage="growing"
      className="rounded-2xl p-4"
      aria-label={`${moveFace} — ${role.label} starter card`}
    >
      {/* Move + face row */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.14em]"
          style={{ color: tokens.gem }}
        >
          {moveFace}
        </span>
        <span aria-hidden className="text-base leading-none" style={{ color: tokens.gem }}>
          {tokens.sigil}
        </span>
      </div>

      {/* Title = the real card title */}
      <h4 className="mt-2 font-semibold tracking-tight text-[var(--cs-card-title,#f4f2ec)]">
        {title}
      </h4>

      {/* Contemplative question */}
      <p className="mt-1 text-[13px] italic leading-snug text-[#cfcdc6]">{question}</p>

      {/* The practice the card asks of you */}
      {practice ? (
        <p className="mt-2 text-[12px] leading-snug text-[#a09e98]">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: tokens.gem }}>
            Practice ·{' '}
          </span>
          {practice}
        </p>
      ) : null}

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

      {/* Footer: domain · collector mark */}
      <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b6965]">
        <span>{domainText}</span>
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
