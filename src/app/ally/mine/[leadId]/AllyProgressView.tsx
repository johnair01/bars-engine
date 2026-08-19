'use client'

/**
 * AllyProgressView — what an ally sees when they come back.
 *
 * Three jobs, in order of how much they matter:
 *
 *  1. **Let them put something down.** Someone who can't hand a task back either
 *     silently drops it (and you find out in March) or avoids the page entirely.
 *     Release is the first-class action here, not a hidden link — it's what makes
 *     picking something up feel safe in the first place.
 *  2. Show them what they're holding and what they've banked.
 *  3. Offer more, so returning has a point beyond letting go.
 *
 * No account, no password. The URL is the credential.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { claimNeed, releaseNeed, type AttributedSales } from '@/actions/ally-campaign'
import { getDomainLabel } from '@/lib/allyship-domains'
import { usd } from '@/lib/ally-campaign/economics'
import { allyReferralPath } from '@/lib/ally-campaign/warm-selling'
import type { AllyProgress, AllyTask } from '@/lib/ally-campaign/board'

const PURPLE = 'var(--bars-liminal)'
const GOLD = '#d4a017'
const INK = '#f4f2ec'
const DIM = '#a09e98'
const FAINT = '#6b6862'
const PANEL = '#121210'

export function AllyProgressView({
  progress,
  sales,
}: {
  progress: AllyProgress
  sales?: AttributedSales
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [showMore, setShowMore] = useState(false)
  const [pending, startTransition] = useTransition()

  const active = progress.held.filter((t) => t.status !== 'done')
  const done = progress.held.filter((t) => t.status === 'done')

  function release(needId: string) {
    setError(null)
    startTransition(async () => {
      const res = await releaseNeed({ needId, leadId: progress.leadId })
      if (!res.ok) setError(res.error ?? 'Could not release that.')
      else router.refresh()
    })
  }

  function take(needId: string) {
    setError(null)
    startTransition(async () => {
      const res = await claimNeed({ needId, leadId: progress.leadId })
      if (!res.ok) setError(res.error ?? 'Could not take that.')
      else router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span
          className="text-[10px] uppercase"
          style={{ fontFamily: 'var(--bars-font-mono)', letterSpacing: '.26em', color: GOLD }}
        >
          your allyship
        </span>
        <h1 className="text-[27px] font-bold leading-tight" style={{ color: INK }}>
          {progress.name ? `${progress.name}, here's what you're holding` : "Here's what you're holding"}
        </h1>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {progress.superpower && <Chip>{progress.superpower.replace(/_/g, ' ')}</Chip>}
          {progress.orientation && <Chip>{progress.orientation}</Chip>}
          {progress.domain && <Chip>{getDomainLabel(progress.domain)}</Chip>}
          {progress.vibeulonsEarned > 0 && <Chip accent>{progress.vibeulonsEarned} vibeulons banked</Chip>}
        </div>
      </header>

      {error && (
        <p
          className="rounded-lg px-4 py-3 text-[13.5px]"
          style={{ background: 'rgba(204,136,136,.14)', color: '#f0d0d0' }}
        >
          {error}
        </p>
      )}

      {/* ── Their selling link ──────────────────────────────────────────────
          The whole warm channel depends on a contribution being attributable.
          Their lead id is already an unguessable token, so it doubles as a
          referral code with no account and no second identity to reconcile. */}
      <ReferralLink leadId={progress.leadId} sales={sales} />

      {/* ── What they're holding ────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[17px] font-bold" style={{ color: INK }}>
          {active.length > 0 ? `You're on ${active.length}` : 'Nothing on your plate'}
        </h2>

        {active.length === 0 ? (
          <Empty>
            You&apos;re not holding anything right now. That&apos;s a legitimate place to be — take
            something below if you want to, or close the tab.
          </Empty>
        ) : (
          active.map((task) => (
            <div
              key={task.id}
              className="flex flex-col gap-2 rounded-xl border border-white/[0.10] p-4"
              style={{ background: PANEL }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[16px] font-semibold" style={{ color: INK }}>
                  {task.title}
                </span>
                <span className="shrink-0 text-[11px]" style={{ color: FAINT }}>
                  {task.workstream}
                </span>
              </div>
              <p className="text-[13.5px] leading-relaxed" style={{ color: DIM }}>
                {task.detail}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Chip>{costLabel(task)}</Chip>
                <Chip>{task.bountyVibeulons} vib</Chip>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => release(task.id)}
                  disabled={pending}
                  className="rounded-lg px-3 py-1.5 text-[13px] font-semibold disabled:opacity-50"
                  style={{ color: DIM, border: '1px solid rgba(255,255,255,.14)' }}
                >
                  Put this back
                </button>
                <span className="text-[12px]" style={{ color: FAINT }}>
                  No explanation needed. It goes back to the pool.
                </span>
              </div>
            </div>
          ))
        )}
      </section>

      {/* ── Finished ───────────────────────────────────────────────────── */}
      {done.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[17px] font-bold" style={{ color: INK }}>
            Finished
          </h2>
          {done.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-4 py-3"
              style={{ background: PANEL }}
            >
              <span className="text-[14px]" style={{ color: '#e6e4de' }}>
                ✓ {task.title}
              </span>
              <span className="text-[12px] font-semibold" style={{ color: GOLD }}>
                +{task.bountyVibeulons} vib
              </span>
            </div>
          ))}
        </section>
      )}

      {/* ── Their offers ───────────────────────────────────────────────── */}
      {progress.offers.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-[17px] font-bold" style={{ color: INK }}>
            What you offered
          </h2>
          {progress.offers.map((o) => (
            <div
              key={o.id}
              className="rounded-xl border border-white/[0.06] px-4 py-3"
              style={{ background: PANEL }}
            >
              <p className="text-[13.5px] leading-relaxed" style={{ color: '#cfcdc6' }}>
                “{o.body}”
              </p>
              <span className="mt-1.5 inline-block text-[11px]" style={{ color: FAINT }}>
                {o.status === 'open' ? 'Wendell hasn’t responded yet' : `Status: ${o.status}`}
              </span>
            </div>
          ))}
        </section>
      )}

      {/* ── Take something else ────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[17px] font-bold" style={{ color: INK }}>
            Still open ({progress.available.length})
          </h2>
          <button
            onClick={() => setShowMore((v) => !v)}
            className="text-[13px] font-semibold"
            style={{ color: PURPLE }}
          >
            {showMore ? 'Hide' : 'Show me'}
          </button>
        </div>

        {showMore &&
          (progress.available.length === 0 ? (
            <Empty>Everything has someone on it. Genuinely a first.</Empty>
          ) : (
            progress.available.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-2 rounded-xl border border-white/[0.08] p-4"
                style={{ background: PANEL }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[15px] font-semibold" style={{ color: INK }}>
                    {task.title}
                  </span>
                  <span className="shrink-0 text-[11px]" style={{ color: FAINT }}>
                    {task.workstream}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: DIM }}>
                  {task.detail}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip>{costLabel(task)}</Chip>
                  <Chip>{task.bountyVibeulons} vib</Chip>
                  {task.matchesSuperpower && <Chip accent>your superpower</Chip>}
                </div>
                <button
                  onClick={() => take(task.id)}
                  disabled={pending}
                  className="mt-1 self-start rounded-lg px-4 py-2 text-[13.5px] font-semibold text-white disabled:opacity-50"
                  style={{ background: PURPLE }}
                >
                  I&apos;ll take this
                </button>
              </div>
            ))
          ))}
      </section>

      <footer className="flex flex-col gap-2 border-t border-white/[0.07] pt-5">
        <p className="text-[12.5px] leading-relaxed" style={{ color: FAINT }}>
          Bookmark this page — it&apos;s the only way back to it. There&apos;s no account and no
          password, so the link is the key.
        </p>
        <Link href="/mastering-allyship" className="text-[13.5px] font-semibold" style={{ color: PURPLE }}>
          Read more about the work →
        </Link>
      </footer>
    </div>
  )
}

/**
 * The ally's tracking link — what turns "I told some people" into a number.
 *
 * Rendered for every ally, not only those holding a selling task: someone who
 * took nothing may still mention the book to one person, and that copy should
 * still find its way back to them.
 *
 * The origin is read at click time rather than baked in, because this component
 * is statically rendered and has no reliable notion of its own host at build.
 */
function ReferralLink({ leadId, sales }: { leadId: string; sales?: AttributedSales }) {
  const [copied, setCopied] = useState(false)
  const path = allyReferralPath(leadId)
  const sold = sales?.count ?? 0

  async function copy() {
    const full = `${window.location.origin}${path}`
    try {
      await navigator.clipboard.writeText(full)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (insecure context, permissions). The link is visible
      // on screen either way, so this fails quietly rather than alarming anyone.
    }
  }

  return (
    <section
      className="flex flex-col gap-2 rounded-xl border border-white/[0.08] px-4 py-4"
      style={{ background: 'rgba(139,92,246,.08)' }}
    >
      <span className="text-[12px] uppercase" style={{ letterSpacing: '.14em', color: PURPLE }}>
        your selling link
      </span>
      <p className="text-[13.5px] leading-relaxed" style={{ color: DIM }}>
        Anything bought through this counts as yours on the board. Use it when you post, when you
        text someone, when a podcast asks where to send people.
      </p>
      <code
        className="overflow-x-auto rounded-lg px-3 py-2 text-[12.5px]"
        style={{ background: 'rgba(0,0,0,.35)', color: INK }}
      >
        {path}
      </code>
      <button
        onClick={copy}
        className="self-start rounded-lg px-3 py-2 text-[13px] font-semibold"
        style={{ background: PURPLE, color: '#fff' }}
      >
        {copied ? 'Copied ✓' : 'Copy my link'}
      </button>

      {/* The number, or an honest zero. A referral surface that only appears
          once it has something to boast about teaches allies not to trust it. */}
      <div className="flex flex-col gap-1 border-t border-white/[0.08] pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13.5px]" style={{ color: DIM }}>
            Sold through your link
          </span>
          <span
            className="text-[18px] font-bold tabular-nums"
            style={{ color: sold > 0 ? GOLD : FAINT }}
          >
            {sold}
          </span>
        </div>
        {sold === 0 ? (
          <p className="text-[12.5px] leading-relaxed" style={{ color: FAINT }}>
            Nothing yet. This counts purchases made through your link — it can&apos;t see a copy
            someone bought after you mentioned it in person, so tell me about those and I&apos;ll
            add them by hand.
          </p>
        ) : (
          <p className="text-[12.5px] leading-relaxed" style={{ color: FAINT }}>
            {sales!.bySku.map((s) => `${s.count} × ${s.sku}`).join(' · ')}. Refunds drop off this
            number automatically.
          </p>
        )}
      </div>
    </section>
  )
}

function Chip({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        background: accent ? 'rgba(212,160,23,.14)' : 'rgba(255,255,255,.06)',
        color: accent ? GOLD : DIM,
      }}
    >
      {children}
    </span>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="rounded-xl border border-white/[0.06] px-4 py-5 text-[14px] leading-relaxed"
      style={{ background: PANEL, color: FAINT }}
    >
      {children}
    </p>
  )
}

function costLabel(task: AllyTask): string {
  if (task.unit === 'currency') return usd(task.value * 100)
  if (task.unit === 'hours') return `${task.value} ${task.value === 1 ? 'hour' : 'hours'}`
  return task.value === 1 ? 'one action' : `${task.value} actions`
}
