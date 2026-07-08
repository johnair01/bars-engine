import type { Metadata } from 'next'
import Link from 'next/link'
import {
  bodyFor,
  headerFor,
  hubBranches,
  involveActions,
  oneOnOneScheduleHref,
  type HubAudience,
  type HubBranch,
  type HubCta,
} from '@/lib/kickstarter-hub/content'
import { SelfReport } from './SelfReport'
import { ShareKit } from './ShareKit'

/**
 * @route GET /kickstarter
 * @page /kickstarter
 * @entity CAMPAIGN
 * @description MTGOA Kickstarter CYOA hub (SPEC v2). A single interactive page,
 *   linked from the July 17 backer email (warm) and social (public), that lets a
 *   backer self-select their next step. A persistent fulfillment header answers
 *   "how/when do I get my stuff" without a click; seven branches mirror the
 *   book's own developmental spine (wake up → open up → clean up → show up →
 *   what's next → get involved → help fund). Every branch carries a visible
 *   status and a non-dead fallback. `?audience=public` switches to the public
 *   register; default is the warm (backer) register.
 * @permissions public
 * @query audience — "warm" (default) | "public"
 * @example /kickstarter
 * @example /kickstarter?audience=public
 * @agentDiscoverable true
 */

export const metadata: Metadata = {
  title: 'Mastering the Game of Allyship — Your Next Step',
  description:
    'The book ships August 1 — and a game, two quizzes, and a deck for doing the work are ready to play with right now. Pick your next step.',
}

function normalizeAudience(v?: string): HubAudience {
  return v === 'public' ? 'public' : 'warm'
}

function StatusPill({ status }: { status: HubBranch['status'] }) {
  return status === 'ready' ? (
    <span className="ks-pill ks-pill--ready">ready now</span>
  ) : (
    <span className="ks-pill ks-pill--soon">coming soon</span>
  )
}

function Cta({ cta }: { cta: HubCta }) {
  const cls = cta.secondary ? 'ks-cta ks-cta--ghost' : 'ks-cta'
  if (cta.external) {
    return (
      <a className={cls} href={cta.href} target="_blank" rel="noopener noreferrer">
        {cta.label} →
      </a>
    )
  }
  return (
    <Link className={cls} href={cta.href}>
      {cta.label} →
    </Link>
  )
}

/** The expanded get-involved branch (§4): four concrete actions, then the share
 *  kit, then the identification-not-solicitation self-report. */
function GetInvolved({ audience }: { audience: HubAudience }) {
  const actions = involveActions()
  const scheduleHref = oneOnOneScheduleHref()
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((a) => (
          <div key={a.key} className="ks-card ks-card--interactive p-4" data-accent="coral">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-[15px] font-bold lowercase" style={{ color: 'var(--bars-text-primary)' }}>
                {a.title}
              </h4>
              <StatusPill status={a.status} />
            </div>
            <p
              className="mt-1.5 text-[13px]"
              style={{
                fontFamily: 'var(--bars-font-body)',
                lineHeight: 1.5,
                color: 'var(--bars-text-secondary)',
              }}
            >
              {audience === 'warm' ? a.bodyWarm : a.bodyPublic}
            </p>
            {a.key === '1on1' && scheduleHref && (
              <p
                className="mt-1 text-[12px]"
                style={{ fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-muted)' }}
              >
                pay via gumroad, then pick your time on{' '}
                <a
                  href={scheduleHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: 'var(--ks-teal-lite)' }}
                >
                  calendly
                </a>
                .
              </p>
            )}
            <div className="mt-3">
              <Cta cta={a.cta} />
            </div>
          </div>
        ))}
      </div>

      {/* Help sell the book / post on social — the concrete copy to paste. */}
      <div>
        <span className="ks-eyebrow">ready-to-send copy</span>
        <div className="mt-2">
          <ShareKit audience={audience} />
        </div>
      </div>

      {/* Self-report — identification, not solicitation. */}
      <div>
        <span className="ks-eyebrow">or just tell me who you are</span>
        <div className="mt-2">
          <SelfReport audience={audience} />
        </div>
      </div>
    </div>
  )
}

function Branch({ branch, audience }: { branch: HubBranch; audience: HubAudience }) {
  const isHolding = branch.status === 'coming-soon'
  const interactive = Boolean(branch.ctas?.length) || branch.order === 6
  const cardClass = [
    'ks-card',
    'p-5 sm:p-6',
    'ks-rise',
    branch.primary ? 'ks-card--primary' : '',
    isHolding ? 'ks-card--holding' : '',
    interactive ? 'ks-card--interactive' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section
      className={cardClass}
      data-accent={branch.accent}
      aria-label={`step ${branch.order}: ${branch.move}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="ks-eyebrow">{branch.eyebrow}</span>
        <StatusPill status={branch.status} />
      </div>

      <h2
        className="mt-2 text-[22px] font-bold lowercase sm:text-[26px]"
        style={{
          fontFamily: 'var(--bars-font-display)',
          letterSpacing: '-0.02em',
          lineHeight: 1.08,
          color: branch.primary ? 'var(--ks-accent-lite)' : 'var(--bars-text-primary)',
          textWrap: 'balance',
        }}
      >
        {branch.title}
      </h2>

      <p
        className="mt-2 max-w-[52ch] text-[14px]"
        style={{
          fontFamily: 'var(--bars-font-body)',
          lineHeight: 1.6,
          color: 'var(--bars-text-secondary)',
        }}
      >
        {bodyFor(branch, audience)}
      </p>

      {branch.order === 6 && (
        <div className="mt-5">
          <GetInvolved audience={audience} />
        </div>
      )}

      {branch.ctas && branch.ctas.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {branch.ctas.map((cta) => (
            <Cta key={cta.href + cta.label} cta={cta} />
          ))}
        </div>
      )}

      {/* Coming-soon holding state (§5): "here's what's coming and why", never a dead link. */}
      {isHolding && branch.holding && (
        <p
          className="mt-4 rounded-[10px] border border-dashed p-3 text-[13px]"
          style={{
            borderColor: 'var(--bars-line-dashed)',
            fontFamily: 'var(--bars-font-body)',
            lineHeight: 1.55,
            color: 'var(--bars-text-muted)',
          }}
        >
          {branch.holding}
        </p>
      )}
    </section>
  )
}

export default async function KickstarterHubPage({
  searchParams,
}: {
  searchParams: Promise<{ audience?: string }>
}) {
  const { audience: rawAudience } = await searchParams
  const audience = normalizeAudience(rawAudience)
  const header = headerFor(audience)
  const branches = hubBranches()

  return (
    <main className="ks-hub flex justify-center">
      <div className="flex w-full max-w-[680px] flex-col gap-5 px-5 pb-16 pt-8">
        {/* Kicker */}
        <header className="ks-rise flex flex-col gap-2">
          <span className="ks-eyebrow">{header.kicker}</span>

          {/* Persistent fulfillment header (§2) — answers Q1 before any choice. */}
          <div className="ks-fulfillment mt-1 p-4 sm:p-5">
            <p
              className="text-[17px] font-bold lowercase sm:text-[19px]"
              style={{
                fontFamily: 'var(--bars-font-display)',
                letterSpacing: '-0.01em',
                lineHeight: 1.18,
                color: 'var(--bars-text-primary)',
                textWrap: 'balance',
              }}
            >
              {header.statusLine}
            </p>
            <p
              className="mt-2 text-[13.5px]"
              style={{
                fontFamily: 'var(--bars-font-body)',
                lineHeight: 1.55,
                color: 'var(--bars-text-secondary)',
              }}
            >
              {header.subline}
            </p>
          </div>

          <p
            className="mt-1 text-[13px]"
            style={{ fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-muted)' }}
          >
            pick where you want to go next — most doors are open right now.
          </p>
        </header>

        {/* The spine (§3) */}
        {branches.map((branch) => (
          <Branch key={branch.order} branch={branch} audience={audience} />
        ))}

        <p
          className="mt-2 text-center text-[12px]"
          style={{ fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-muted)' }}
        >
          the book ships august 1. everything marked “ready now” is yours to use today.
        </p>
      </div>
    </main>
  )
}
