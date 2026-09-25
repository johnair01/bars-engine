import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import {
  CHAPTER_ONE_DESIGN_HANDOFF_PATH,
  CHAPTER_ONE_LEAD_SOURCE,
  CHAPTER_ONE_PDF_HREF,
  chapterOneLeadsToCsv,
  type ChapterOneLeadRow,
} from '@/lib/mastering-allyship/chapter-one-lead'

export const metadata: Metadata = { title: 'Launch leads - Admin' }

/**
 * @page /admin/launch-leads
 * @entity SYSTEM
 * @description Admin review/export surface for Mastering Allyship Chapter 1 funnel leads.
 * @permissions admin
 * @relationships reads FunnelSignup rows for source mastering-allyship-chapter-1
 * @dimensions WHO:admin, WHAT:lead list, WHERE:launch funnel, ENERGY:show_up
 * @example /admin/launch-leads
 * @agentDiscoverable true
 */
function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export default async function AdminLaunchLeadsPage() {
  const [total, today, rows] = await Promise.all([
    db.funnelSignup.count({ where: { source: CHAPTER_ONE_LEAD_SOURCE } }),
    db.funnelSignup.count({
      where: {
        source: CHAPTER_ONE_LEAD_SOURCE,
        createdAt: { gte: startOfToday() },
      },
    }),
    db.funnelSignup.findMany({
      where: { source: CHAPTER_ONE_LEAD_SOURCE },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        id: true,
        email: true,
        name: true,
        source: true,
        createdAt: true,
      },
    }),
  ])

  const csv = chapterOneLeadsToCsv(rows satisfies ChapterOneLeadRow[])
  const lastLead = rows[0]?.createdAt ?? null

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-zinc-200 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3">
          <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Admin
          </Link>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-400">
              Mastering Allyship launch
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">Chapter 1 leads</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Leads captured by the Chapter 1 opt-in. V1 follow-up stays inside BARs Engine plus
              Resend: copy the CSV for manual sending, segmentation, or import later.
            </p>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Stat label="Total leads" value={String(total)} />
          <Stat label="Today" value={String(today)} />
          <Stat
            label="Latest"
            value={lastLead ? lastLead.toISOString().slice(0, 10) : 'none'}
          />
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
          <h2 className="text-sm font-bold text-white">Readiness</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <ReadinessItem label="Capture source" value={CHAPTER_ONE_LEAD_SOURCE} />
            <ReadinessItem label="Delivery URL" value={CHAPTER_ONE_PDF_HREF} href={CHAPTER_ONE_PDF_HREF} />
            <ReadinessItem
              label="Design handoff"
              value={CHAPTER_ONE_DESIGN_HANDOFF_PATH}
            />
            <ReadinessItem label="Email provider" value="Resend via existing sendEmail service" />
          </dl>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">CSV export</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Latest 500 Chapter 1 leads. This is intentionally copy-ready for V1 operations.
              </p>
            </div>
            <Link
              href="/mastering-allyship/chapter-1"
              className="text-xs font-bold text-emerald-400 hover:underline"
            >
              Open public opt-in
            </Link>
          </div>
          <textarea
            readOnly
            value={csv}
            className="min-h-48 w-full rounded-xl border border-zinc-800 bg-black p-4 font-mono text-xs leading-5 text-zinc-300"
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-white">Recent leads</h2>
          {rows.length === 0 ? (
            <p className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 text-sm text-zinc-500">
              No Chapter 1 leads captured yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.slice(0, 50).map((row) => (
                <li
                  key={row.id}
                  className="grid gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm sm:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{row.email}</p>
                    <p className="mt-1 text-xs text-zinc-500">{row.name || 'Name not provided'}</p>
                  </div>
                  <time className="text-xs text-zinc-500" dateTime={row.createdAt.toISOString()}>
                    {row.createdAt.toISOString().replace('T', ' ').slice(0, 16)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function ReadinessItem({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{label}</dt>
      <dd className="mt-1 break-words font-mono text-xs text-zinc-300">
        {href ? (
          <Link href={href} className="text-emerald-400 hover:underline">
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}
