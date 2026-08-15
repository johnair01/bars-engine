/**
 * @route /campaign/[ref]/allies
 * @entity CAMPAIGN
 * @description The steward dashboard for the ally campaign: who is working on
 *   what, what nobody has picked up, what people offered that wasn't asked for,
 *   and where the goal numbers actually stand. Steward-gated; links to the CSV
 *   export of the same data.
 * @permissions steward (global admin, instance owner/steward, or campaign creator)
 * @dimensions WHO:steward, WHAT:campaign operations, WHERE:mobility-quest tree, ENERGY:clean_up
 *
 * Reads the whole campaign TREE — parent plus every workstream sub-campaign — in
 * one pass, so nesting a sub-campaign never splits the steward's view.
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { allyBoard } from '@/actions/ally-campaign'
import { PARENT_REF, TOTAL_AUTHORED_NEEDS } from '@/lib/ally-campaign/board'
import { MarkDoneButton } from './MarkDoneButton'
import { getDomainLabel } from '@/lib/allyship-domains'
import { WORKSTREAMS, TOTAL_BOUNTY_VIBEULONS } from '@/lib/ally-campaign/workstreams'
import { campaignTotals, repaymentPlan, usd } from '@/lib/ally-campaign/economics'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ally Board — Mobility Quest',
  robots: { index: false, follow: false },
}

const INK = '#f4f2ec'
const DIM = '#a09e98'
const FAINT = '#6b6862'
const GOLD = '#d4a017'
const PURPLE = 'var(--bars-liminal)'
const PANEL = '#121210'

export default async function AlliesDashboard({
  params,
}: {
  params: Promise<{ ref: string }>
}) {
  const { ref } = await params
  if (ref !== PARENT_REF) notFound()

  const res = await allyBoard()

  if (!res.ok) {
    return (
      <Shell>
        <h1 className="text-[24px] font-bold" style={{ color: INK }}>
          Ally Board
        </h1>
        <p className="text-[15px]" style={{ color: DIM }}>
          {res.error}
        </p>
        <Link href="/login" className="text-[14px] font-semibold" style={{ color: PURPLE }}>
          Sign in as a steward →
        </Link>
      </Shell>
    )
  }

  const { board } = res
  const t = board.totals
  const totals = campaignTotals()
  const plan = repaymentPlan()

  return (
    <Shell>
      <header className="flex flex-col gap-2">
        <span
          className="text-[10px] uppercase"
          style={{ fontFamily: 'var(--bars-font-mono)', letterSpacing: '.26em', color: GOLD }}
        >
          mobility quest · steward view
        </span>
        <h1 className="text-[28px] font-bold" style={{ color: INK }}>
          Ally Board
        </h1>
        <p className="text-[14px]" style={{ color: DIM }}>
          Everyone who walked the ally CYOA, what they took, and what still has nobody on it.
          Rolls up the parent campaign and all {WORKSTREAMS.length} workstream sub-campaigns.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href={`/api/campaign/${PARENT_REF}/export`}
            className="rounded-xl px-4 py-2.5 text-[14px] font-semibold text-white"
            style={{ background: PURPLE }}
          >
            ↓ Download the spreadsheet (CSV)
          </a>
          <Link
            href="/ally/mom"
            className="rounded-xl border border-white/[0.12] px-4 py-2.5 text-[14px] font-semibold"
            style={{ color: DIM }}
          >
            Preview the ally CYOA →
          </Link>
        </div>
      </header>

      {/* ── Numbers ────────────────────────────────────────────────────────── */}
      <Section title="Where the numbers stand">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Allies" value={t.leads} />
          <Stat label="Tasks taken" value={`${t.claimedNeeds} / ${TOTAL_AUTHORED_NEEDS}`} />
          <Stat label="Nobody on it" value={t.openNeeds} accent={t.openNeeds > 0} />
          <Stat label="Done" value={t.doneNeeds} />
          <Stat label="Money pledged" value={usd(t.currencyPledged * 100)} />
          <Stat label="Hours pledged" value={`${t.hoursPledged}h`} />
          <Stat
            label="Vibeulons pledged"
            value={`${t.pledgedVibeulons} / ${TOTAL_BOUNTY_VIBEULONS}`}
          />
          <Stat label="Vibeulons banked" value={t.bankedVibeulons} />
        </div>
        <p className="pt-2 text-[12px] leading-relaxed" style={{ color: FAINT }}>
          Units are reported separately and never blended — money, hours, and actions are not
          convertible into one another. Capital target is {usd(totals.capitalNeededCents)}; the car
          repays at {usd(plan.monthlyCents)}/month over {plan.workshopsNeeded} workshops and{' '}
          {plan.booksNeeded} books.
        </p>
      </Section>

      {/* ── Who needs help ─────────────────────────────────────────────────── */}
      <Section title={`Needs a person (${board.unclaimed.length})`}>
        {board.unclaimed.length === 0 ? (
          <Empty>Every task has someone on it. That has never once happened, so enjoy it.</Empty>
        ) : (
          <div className="flex flex-col gap-2">
            {board.unclaimed.map((n) => (
              <div
                key={n.id}
                id={`need-${n.id}`}
                className="rounded-xl border px-4 py-3"
                style={{
                  background: PANEL,
                  borderColor: n.needsHelp ? 'rgba(212,160,23,.35)' : 'rgba(255,255,255,.08)',
                }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[15px] font-semibold" style={{ color: INK }}>
                    {n.title}
                  </span>
                  <span className="text-[12px]" style={{ color: FAINT }}>
                    {n.workstream} · {getDomainLabel(n.domain)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Chip>{n.superpower}</Chip>
                  <Chip>{n.orientation === 'internal' ? 'inner' : 'outer'}</Chip>
                  <Chip>{unitLabel(n.unit, n.value)}</Chip>
                  <Chip>{n.bountyVibeulons} vib</Chip>
                  {n.needsHelp && <Chip accent>flagged</Chip>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Who's working on what ──────────────────────────────────────────── */}
      <Section title={`Who's working on what (${board.leads.length})`}>
        {board.leads.length === 0 ? (
          <Empty>No one has walked the CYOA yet. Send the first link.</Empty>
        ) : (
          <div className="flex flex-col gap-2">
            {board.leads.map((lead) => {
              const theirs = board.needs.filter((n) => n.claimedByLeadId === lead.id)
              return (
                <div
                  key={lead.id}
                  id={`lead-${lead.id}`}
                  className="rounded-xl border border-white/[0.08] px-4 py-3.5"
                  style={{ background: PANEL }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[16px] font-semibold" style={{ color: INK }}>
                      {lead.name || 'Anonymous ally'}
                    </span>
                    <span className="text-[12px]" style={{ color: FAINT }}>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Chip>{lead.status}</Chip>
                    {lead.superpower && <Chip>{lead.superpower}</Chip>}
                    {lead.orientation && <Chip>{lead.orientation}</Chip>}
                    {lead.domain && <Chip>{getDomainLabel(lead.domain)}</Chip>}
                    {lead.workstream && <Chip accent>{lead.workstream}</Chip>}
                    {lead.vibeulonsEarned > 0 && <Chip accent>{lead.vibeulonsEarned} vib banked</Chip>}
                  </div>

                  {lead.contact && (
                    <p className="mt-2 text-[13px]" style={{ color: DIM }}>
                      {lead.contact}
                    </p>
                  )}

                  {theirs.length > 0 && (
                    <ul className="mt-2.5 flex flex-col gap-1.5 border-l-2 pl-3" style={{ borderColor: PURPLE }}>
                      {theirs.map((n) => (
                        <li
                          key={n.id}
                          className="flex flex-wrap items-center gap-2 text-[13.5px]"
                          style={{ color: '#e6e4de' }}
                        >
                          <span>
                            {n.status === 'done' ? '✓ ' : '◷ '}
                            {n.title}
                            <span style={{ color: FAINT }}> · {unitLabel(n.unit, n.value)}</span>
                          </span>
                          {n.status !== 'done' && (
                            <MarkDoneButton
                              needId={n.id}
                              label={n.title}
                              bountyVibeulons={n.bountyVibeulons}
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {lead.notes && (
                    <p
                      className="mt-2.5 rounded-lg px-3 py-2 text-[13.5px] leading-relaxed"
                      style={{ background: 'rgba(255,255,255,.04)', color: '#cfcdc6' }}
                    >
                      “{lead.notes}”
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* ── Offers ─────────────────────────────────────────────────────────── */}
      <Section title={`Offered, unasked-for (${board.offers.length})`}>
        {board.offers.length === 0 ? (
          <Empty>Nothing offered yet.</Empty>
        ) : (
          <div className="flex flex-col gap-2">
            {board.offers.map((o) => (
              <div
                key={o.id}
                id={`offer-${o.id}`}
                className="rounded-xl border border-white/[0.08] px-4 py-3"
                style={{ background: PANEL }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[14px] font-semibold" style={{ color: INK }}>
                    {o.leadName || 'Anonymous'}
                  </span>
                  <div className="flex gap-1.5">
                    <Chip>{o.status}</Chip>
                    <Chip>{unitLabel(o.unit, o.value)}</Chip>
                  </div>
                </div>
                <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: '#cfcdc6' }}>
                  {o.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Workstream rollup ──────────────────────────────────────────────── */}
      <Section title="By workstream">
        <div className="flex flex-col gap-2">
          {WORKSTREAMS.map((w) => {
            const ids = new Set(w.needs.map((n) => n.id))
            const mine = board.needs.filter((n) => ids.has(n.id))
            const taken = mine.filter((n) => n.status !== 'open').length
            return (
              <div
                key={w.key}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.08] px-4 py-3"
                style={{ background: PANEL }}
              >
                <div>
                  <span className="text-[15px] font-semibold" style={{ color: INK }}>
                    {w.title}
                  </span>
                  <span className="ml-2 text-[12px]" style={{ color: FAINT }}>
                    {getDomainLabel(w.domain)} · mobility-quest-{w.key}
                  </span>
                </div>
                <span className="text-[13px] tabular-nums" style={{ color: taken > 0 ? GOLD : FAINT }}>
                  {taken} / {w.needs.length} taken
                </span>
              </div>
            )
          })}
        </div>
      </Section>
    </Shell>
  )
}

// ── Presentational ──────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex min-h-screen justify-center"
      style={{
        background: 'radial-gradient(125% 85% at 50% -10%, #17121c 0%, var(--bars-bg-base) 62%)',
        fontFamily: 'var(--bars-font-body)',
      }}
    >
      <div className="flex w-full max-w-[860px] flex-col gap-8 px-5 pb-20 pt-10">{children}</div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[18px] font-bold" style={{ color: INK }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.08] px-4 py-3" style={{ background: PANEL }}>
      <div className="text-[11px] uppercase" style={{ letterSpacing: '.14em', color: FAINT }}>
        {label}
      </div>
      <div className="mt-1 text-[20px] font-bold tabular-nums" style={{ color: accent ? GOLD : INK }}>
        {value}
      </div>
    </div>
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
      className="rounded-xl border border-white/[0.06] px-4 py-5 text-[14px]"
      style={{ background: PANEL, color: FAINT }}
    >
      {children}
    </p>
  )
}

function unitLabel(unit: string, value: number): string {
  if (unit === 'currency') return usd(value * 100)
  if (unit === 'hours') return `${value}h`
  return `${value} ${value === 1 ? 'action' : 'actions'}`
}
