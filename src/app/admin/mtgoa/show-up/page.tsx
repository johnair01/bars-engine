import Link from 'next/link'

import { db } from '@/lib/db'
import {
  SHOW_UP_STEWARD_REQUESTS,
  SHOW_UP_SUBMISSION_STATUSES,
} from '@/lib/mtgoa-course/show-up-handoff'
import { ReviewControls } from './ReviewControls'

/**
 * @page /admin/mtgoa/show-up
 * @entity MTGOA
 * @description The private steward queue for Day 10 handoffs.
 * @permissions admin (enforced by src/app/admin/layout.tsx)
 *
 * The queue Wendell works. It shows the exact artifact a sender chose to share,
 * contact only where it was supplied with consent, and a reply control that
 * opens the sender's own route — bars-engine stays out of the messaging
 * business.
 *
 * Shaping a submission into campaign work is a separate, deliberate act against
 * `CollectiveOffer` or `MilestoneNeed`. Nothing on this page performs it.
 */

export const metadata = { title: 'Day 10 handoffs — Admin' }
export const dynamic = 'force-dynamic'

const REQUEST_LABEL = new Map(SHOW_UP_STEWARD_REQUESTS.map((r) => [r.key, r.label]))
const STATUS_LABEL = new Map(SHOW_UP_SUBMISSION_STATUSES.map((s) => [s.key, s.label]))

type Search = { status?: string; request?: string; lane?: string }

export default async function AdminShowUpHandoffsPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const filters = await searchParams

  const where = {
    ...(filters.status && STATUS_LABEL.has(filters.status) ? { status: filters.status } : {}),
    ...(filters.request && REQUEST_LABEL.has(filters.request) ? { stewardRequest: filters.request } : {}),
    ...(filters.lane === 'personal' || filters.lane === 'local_team' ? { lane: filters.lane } : {}),
  }

  const [rows, counts] = await Promise.all([
    db.showUpHandoffSubmission.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 300,
      include: { lead: { select: { id: true, name: true, contact: true, channel: true } } },
    }),
    db.showUpHandoffSubmission.groupBy({ by: ['status'], _count: { _all: true } }),
  ])

  const countFor = (key: string) => counts.find((c) => c.status === key)?._count._all ?? 0

  const chip = (label: string, href: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={`rounded-lg border px-3 py-1.5 text-xs transition ${
        active ? 'border-violet-500 bg-violet-500/15 text-violet-200' : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-400">Mastering Allyship · Day 10</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Campaign handoffs</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          What a reader built on Day 10 and chose to send. The 3-2-1, the load check, and the card answers stay in their
          browser. Contact appears only where it was given with consent, and a withdrawal deletes it.
        </p>
      </header>

      <section className="flex flex-wrap gap-2">
        {chip(`All (${counts.reduce((n, c) => n + c._count._all, 0)})`, '/admin/mtgoa/show-up', !filters.status)}
        {SHOW_UP_SUBMISSION_STATUSES.map((s) =>
          chip(`${s.label} (${countFor(s.key)})`, `/admin/mtgoa/show-up?status=${s.key}`, filters.status === s.key),
        )}
      </section>

      <section className="flex flex-wrap gap-2">
        {SHOW_UP_STEWARD_REQUESTS.map((r) =>
          chip(r.key === 'none' ? 'no reply needed' : r.key, `/admin/mtgoa/show-up?request=${r.key}`, filters.request === r.key),
        )}
        {chip('lane: personal', '/admin/mtgoa/show-up?lane=personal', filters.lane === 'personal')}
        {chip('lane: shared work', '/admin/mtgoa/show-up?lane=local_team', filters.lane === 'local_team')}
      </section>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 text-sm text-zinc-500">
          Nothing here yet.
        </p>
      ) : (
        <section className="space-y-4">
          {rows.map((row) => {
            const withdrawn = row.status === 'withdrawn'
            const contact = row.lead?.contact ?? null
            const replyHref = contact
              ? contact.includes('@')
                ? `mailto:${contact}?subject=${encodeURIComponent(`Your Day 10 handoff: ${row.title}`)}`
                : null
              : null
            return (
              <article
                key={row.id}
                className={`rounded-xl border p-5 ${withdrawn ? 'border-zinc-900 bg-zinc-950/30 opacity-60' : 'border-zinc-800 bg-zinc-950/60'}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="font-semibold text-white">{row.title}</h2>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                    {STATUS_LABEL.get(row.status) ?? row.status} ·{' '}
                    {row.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-violet-300/70">
                  {row.lane === 'local_team' ? 'shared work' : 'personal'} · {row.placementState}
                  {row.placementKind ? ` · ${row.placementKind}` : ''}
                  {row.face ? ` · ${row.face}` : ''}
                  {row.campaignRef ? ` · ${row.campaignRef}` : ''}
                </p>

                <dl className="mt-4 space-y-2 text-sm">
                  {([
                    ['purpose', row.purpose],
                    ['next action', row.nextAction],
                    ['owner', row.owner],
                    ['terms', row.terms],
                    ['return', row.returnPlan],
                  ] as const).map(([label, value]) =>
                    value ? (
                      <div key={label} className="grid grid-cols-[110px_1fr] gap-3">
                        <dt className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">{label}</dt>
                        <dd className="whitespace-pre-wrap leading-6 text-zinc-300">{value}</dd>
                      </div>
                    ) : null,
                  )}
                </dl>

                <p className="mt-4 text-sm text-emerald-300">{REQUEST_LABEL.get(row.stewardRequest) ?? row.stewardRequest}</p>
                {row.note ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{row.note}</p> : null}
                {row.placementLearning ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">what it taught them: </span>
                    {row.placementLearning}
                  </p>
                ) : null}

                <div className="mt-4 border-t border-zinc-800 pt-3 text-sm">
                  {withdrawn ? (
                    <p className="text-zinc-500">
                      Withdrawn{row.withdrawnAt ? ` on ${row.withdrawnAt.toLocaleDateString()}` : ''}. Contact details are deleted.
                    </p>
                  ) : contact ? (
                    <p className="text-zinc-400">
                      {row.lead?.name ? `${row.lead.name} · ` : ''}
                      {contact}
                      {row.senderRegion ? ` · ${row.senderRegion}` : ''}
                      {replyHref ? (
                        <>
                          {' · '}
                          <a href={replyHref} className="text-violet-300 hover:text-violet-200">
                            Reply using their chosen route →
                          </a>
                        </>
                      ) : null}
                    </p>
                  ) : (
                    <p className="text-zinc-500">Sent anonymously. No contact record exists for this handoff.</p>
                  )}
                </div>

                {withdrawn ? null : (
                  <ReviewControls id={row.id} status={row.status} stewardNote={row.stewardNote ?? ''} />
                )}
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}
