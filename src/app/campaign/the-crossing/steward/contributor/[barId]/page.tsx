import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { assertSteward } from '@/actions/the-crossing-support'
import {
  channelLabel,
  domainLabel,
  getTheCrossingSupportRole,
  parseContribution,
  STATUS_META,
  THE_CROSSING_CAMPAIGN_REF,
} from '@/lib/the-crossing-support-moves'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import { ContributorFollowUp } from './ContributorFollowUp'

const PAGE_BG = 'radial-gradient(120% 50% at 50% -6%, #16121f 0%, #0a0908 46%)'

export const metadata: Metadata = { title: 'Contributor · The Crossing' }

export default async function ContributorPage(props: {
  params: Promise<{ barId: string }>
}) {
  const { barId } = await props.params
  const player = await getCurrentPlayer()
  if (!player) {
    redirect(`/login?returnTo=${encodeURIComponent(`/campaign/the-crossing/steward/contributor/${barId}`)}`)
  }
  if (!(await assertSteward(player.id))) {
    redirect('/campaign/the-crossing/steward')
  }

  const bar = await db.customBar.findFirst({
    where: { id: barId, campaignRef: THE_CROSSING_CAMPAIGN_REF, evidenceKind: 'support_intake' },
    select: { id: true, contextLines: true, createdAt: true },
  })
  if (!bar) notFound()

  const c = parseContribution(bar)
  const role = getTheCrossingSupportRole(c.role)
  const tokens = ELEMENT_TOKENS[role?.element ?? 'earth']
  const status = STATUS_META[c.status]

  return (
    <main
      className="min-h-screen px-5 py-6 text-[#f4f2ec] sm:px-8"
      style={{ background: PAGE_BG, backgroundColor: '#0a0908' }}
    >
      <div className="mx-auto w-full max-w-[560px] space-y-6">
        <Link
          href="/campaign/the-crossing/steward"
          className="inline-flex font-mono text-[11px] uppercase tracking-[0.14em] text-[#a09e98] transition-colors hover:text-[#f4f2ec]"
        >
          ← Wendell’s board
        </Link>

        {/* Header card */}
        <header
          className="rounded-2xl border p-5"
          style={{
            borderColor: tokens.frame,
            background: `radial-gradient(135% 130% at 90% -14%, ${tokens.gradFrom}, ${tokens.gradTo} 72%)`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-[22px] font-bold tracking-[-0.01em]">{c.name || 'Anonymous'}</h1>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: tokens.gem }}>
                {c.roleLabel} · {domainLabel(role?.primaryDomain ?? 'GATHERING_RESOURCES')}
              </p>
            </div>
            <span
              className="flex-none rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase"
              style={{ background: `${status.color}1f`, color: status.color }}
            >
              {status.label}
            </span>
          </div>
        </header>

        {/* Offering */}
        <section className="space-y-1.5">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b6965]">Offering</h2>
          <p className="text-[15px] font-semibold leading-snug">{c.summary}</p>
          {c.detail ? <p className="text-[13px] leading-relaxed text-[#cfcdc6]">{c.detail}</p> : null}
        </section>

        {/* Reach via + amount */}
        <div className="grid grid-cols-2 gap-3">
          <section className="rounded-xl border border-white/[0.07] p-3" style={{ background: '#121210' }}>
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b6965]">Reach via</h2>
            <p className="mt-1 break-words text-[13px] text-[#d6d4cd]">{c.contact || '—'}</p>
            <p className="text-[11px] text-[#a09e98]">{channelLabel(c.channel)}</p>
          </section>
          {c.amount != null ? (
            <section className="rounded-xl border border-white/[0.07] p-3" style={{ background: '#121210' }}>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b6965]">Amount</h2>
              <p className="mt-1 font-mono text-[15px] font-bold" style={{ color: STATUS_META.accepted.color }}>
                ${Math.round(c.amount).toLocaleString('en-US')}
              </p>
            </section>
          ) : null}
        </div>

        {/* Activity log */}
        {c.notes.length > 0 ? (
          <section className="space-y-2">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b6965]">Activity</h2>
            <ul className="space-y-2">
              {c.notes.map((note, i) => (
                <li
                  key={i}
                  className="border-l-2 pl-3 text-[13px] leading-relaxed text-[#cfcdc6]"
                  style={{ borderColor: tokens.frame }}
                >
                  {note}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <ContributorFollowUp barId={c.id} status={c.status} />
      </div>
    </main>
  )
}
