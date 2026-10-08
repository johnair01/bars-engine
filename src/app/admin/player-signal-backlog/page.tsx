import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { displayTitleForRow, extractComplaintText } from '@/lib/feedback/feedback-title'
import {
  bulkUpdatePlayerSignalStatus,
  promoteSignalToBar,
  updatePlayerSignalBacklogStatus,
} from './actions'

const SOURCES = ['share_your_signal', 'site_signal_nav', 'certification'] as const
const STATUSES = ['new', 'triaged', 'in_progress', 'done', 'wontfix'] as const
const AREAS = ['rules', 'ux', 'tech', 'lore', 'social', 'other'] as const

/** Everything not yet resolved — the default view, so triage starts on real work. */
const OPEN_STATUSES = ['new', 'triaged', 'in_progress'] as const

const SEVERITY_STYLES: Record<string, string> = {
  blocking: 'text-red-400 border-red-500/40',
  high: 'text-amber-400 border-amber-500/40',
  medium: 'text-zinc-400 border-zinc-700',
  low: 'text-zinc-500 border-zinc-800',
}

type Row = {
  id: string
  createdAt: Date
  title: string
  description: string
  source: string
  status: string
  area: string
  severity: string
  contextJson: string | null
  submittedBy: { id: string; name: string | null } | null
}

function contextOf(row: Row): Record<string, unknown> {
  if (!row.contextJson) return {}
  try {
    const parsed = JSON.parse(row.contextJson)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function pathnameOf(row: Row): string {
  const ctx = contextOf(row)
  if (typeof ctx.pathname === 'string' && ctx.pathname.trim()) return ctx.pathname.trim()
  return '(no page)'
}

function promotedBarIdOf(row: Row): string | null {
  const ctx = contextOf(row)
  return typeof ctx.promotedBarId === 'string' ? ctx.promotedBarId : null
}

/**
 * @page /admin/player-signal-backlog
 * @entity SYSTEM
 * @description Durable player feedback (Share Your Signal, nav site-signal, cert reports) as K-space BacklogItem rows
 * @permissions admin
 */
export default async function PlayerSignalBacklogPage(props: {
  searchParams: Promise<{
    status?: string
    area?: string
    source?: string
    path?: string
    group?: string
  }>
}) {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login?callbackUrl=/admin/player-signal-backlog')

  const withRoles = await db.player.findUnique({
    where: { id: player.id },
    include: { roles: { include: { role: true } } },
  })
  const isAdmin = withRoles?.roles.some((r) => r.role.key === 'admin')
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-8">
        <p className="text-amber-400">Admin only.</p>
      </div>
    )
  }

  const sp = await props.searchParams
  const statusFilter = sp.status ?? 'open'
  const areaFilter = sp.area ?? 'all'
  const sourceFilter = sp.source ?? 'all'
  const pathFilter = (sp.path ?? '').trim()
  const grouped = (sp.group ?? 'path') === 'path'

  const statusWhere =
    statusFilter === 'all'
      ? {}
      : statusFilter === 'open'
        ? { status: { in: [...OPEN_STATUSES] } }
        : { status: statusFilter }

  const rows: Row[] = await db.backlogItem.findMany({
    where: {
      source: sourceFilter === 'all' ? { in: [...SOURCES] } : sourceFilter,
      ...statusWhere,
      ...(areaFilter === 'all' ? {} : { area: areaFilter }),
      ...(pathFilter ? { contextJson: { contains: pathFilter } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 300,
    select: {
      id: true,
      createdAt: true,
      title: true,
      description: true,
      source: true,
      status: true,
      area: true,
      severity: true,
      contextJson: true,
      submittedBy: { select: { id: true, name: true } },
    },
  })

  // Unfiltered tallies so the header always shows the true shape of the backlog.
  const statusTotals = await db.backlogItem.groupBy({
    by: ['status'],
    where: { source: { in: [...SOURCES] } },
    _count: { _all: true },
  })

  const groups = new Map<string, Row[]>()
  for (const row of rows) {
    const key = grouped ? pathnameOf(row) : ''
    const list = groups.get(key)
    if (list) list.push(row)
    else groups.set(key, [row])
  }
  const orderedGroups = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)

  const selectClass =
    'rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-200 min-h-[36px]'

  return (
    <div className="min-h-screen bg-black text-zinc-200 p-6 sm:p-10 max-w-5xl mx-auto space-y-6">
      <div>
        <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300 block mb-2">
          ← Admin
        </Link>
        <h1 className="text-2xl font-bold text-white">Player signal backlog</h1>
        <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
          Submissions from Share Your Signal (quest), global nav report, and certification feedback.
          Stored in <code className="text-fuchsia-400/80">backlog_items</code> for production
          durability. JSONL mirror is best-effort on local disk only.
        </p>
        <p className="text-xs text-zinc-500 mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {statusTotals.map((t) => (
            <span key={t.status}>
              <span className="text-zinc-300">{t._count._all}</span> {t.status}
            </span>
          ))}
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 text-xs">
        <label className="flex flex-col gap-1">
          <span className="text-zinc-500">Status</span>
          <select name="status" defaultValue={statusFilter} className={selectClass}>
            <option value="open">open (new + triaged + in progress)</option>
            <option value="all">all</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-zinc-500">Area</span>
          <select name="area" defaultValue={areaFilter} className={selectClass}>
            <option value="all">all</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-zinc-500">Source</span>
          <select name="source" defaultValue={sourceFilter} className={selectClass}>
            <option value="all">all</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-zinc-500">Page contains</span>
          <input
            name="path"
            defaultValue={pathFilter}
            placeholder="/world/"
            className={`${selectClass} placeholder:text-zinc-600`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-zinc-500">Group</span>
          <select name="group" defaultValue={grouped ? 'path' : 'none'} className={selectClass}>
            <option value="path">by page</option>
            <option value="none">flat</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded border border-zinc-600 px-3 py-2 text-zinc-300 hover:bg-zinc-800 min-h-[36px]"
        >
          Apply
        </button>
        <Link
          href="/admin/player-signal-backlog"
          className="px-2 py-2 text-zinc-500 hover:text-zinc-300"
        >
          Reset
        </Link>
      </form>

      <form
        id="bulk-signal-form"
        action={bulkUpdatePlayerSignalStatus}
        className="flex flex-wrap items-center gap-2 text-xs rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
      >
        <span className="text-zinc-500">
          Set checked ({rows.length} shown) to
        </span>
        <select name="status" defaultValue="triaged" className={selectClass}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded border border-zinc-600 px-3 py-1 text-zinc-300 hover:bg-zinc-800 min-h-[36px]"
        >
          Apply to checked
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="text-zinc-500 text-sm">No rows match these filters.</p>
      ) : (
        <div className="space-y-8">
          {orderedGroups.map(([groupKey, groupRows]) => (
            <section key={groupKey || 'all'} className="space-y-4">
              {grouped ? (
                <h2 className="text-sm font-mono text-zinc-400 border-b border-zinc-800 pb-1 flex justify-between gap-2">
                  <span className="truncate">{groupKey}</span>
                  <span className="text-zinc-600 shrink-0">{groupRows.length}</span>
                </h2>
              ) : null}
              <ul className="space-y-4">
                {groupRows.map((row) => {
                  const promotedBarId = promotedBarIdOf(row)
                  const ctx = contextOf(row)
                  const imageUrl = typeof ctx.imageUrl === 'string' ? ctx.imageUrl : null
                  return (
                    <li
                      key={row.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3 text-sm"
                    >
                      <div className="flex flex-wrap justify-between gap-2 text-xs text-zinc-500">
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="ids"
                            value={row.id}
                            form="bulk-signal-form"
                            aria-label={`Select ${row.id}`}
                            className="h-4 w-4 accent-fuchsia-500"
                          />
                          <span className="font-mono text-fuchsia-400/80">{row.source}</span>
                          <span className="rounded border border-zinc-700 px-1.5 py-0.5">
                            {row.status}
                          </span>
                          <span
                            className={`rounded border px-1.5 py-0.5 ${
                              SEVERITY_STYLES[row.severity] ?? SEVERITY_STYLES.medium
                            }`}
                          >
                            {row.severity}
                          </span>
                          <span className="rounded border border-zinc-800 px-1.5 py-0.5">
                            {row.area}
                          </span>
                        </span>
                        <span>
                          {new Date(row.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      <p className="text-zinc-100 font-medium">{displayTitleForRow(row)}</p>
                      <p className="text-zinc-400 text-xs whitespace-pre-wrap max-h-48 overflow-y-auto border border-zinc-800/80 rounded p-2 bg-black/40">
                        {extractComplaintText(row.description)}
                      </p>

                      <p className="text-xs text-zinc-500 flex flex-wrap gap-x-3 gap-y-1">
                        <span>
                          From{' '}
                          {row.submittedBy ? (
                            <span className="text-zinc-300">{row.submittedBy.name}</span>
                          ) : (
                            <span className="italic">unknown</span>
                          )}
                        </span>
                        {typeof ctx.pageUrl === 'string' ? (
                          <a
                            href={ctx.pageUrl}
                            className="text-slate-400 hover:text-slate-200 underline truncate max-w-full"
                          >
                            open page
                          </a>
                        ) : null}
                        {imageUrl ? (
                          <a
                            href={imageUrl}
                            className="text-slate-400 hover:text-slate-200 underline"
                          >
                            screenshot
                          </a>
                        ) : null}
                        {promotedBarId ? (
                          <Link
                            href={`/bars/${promotedBarId}`}
                            className="text-emerald-400 hover:text-emerald-300 underline"
                          >
                            promoted → BAR
                          </Link>
                        ) : null}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <form
                          action={updatePlayerSignalBacklogStatus}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <input type="hidden" name="id" value={row.id} />
                          <label className="text-zinc-500">Status</label>
                          <select name="status" defaultValue={row.status} className={selectClass}>
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="rounded border border-zinc-600 px-2 py-1 text-zinc-300 hover:bg-zinc-800 min-h-[36px]"
                          >
                            Save
                          </button>
                        </form>

                        {promotedBarId ? null : (
                          <form action={promoteSignalToBar}>
                            <input type="hidden" name="id" value={row.id} />
                            <button
                              type="submit"
                              className="rounded border border-emerald-700/60 px-2 py-1 text-emerald-300 hover:bg-emerald-950/40 min-h-[36px]"
                            >
                              Spawn BAR
                            </button>
                          </form>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
