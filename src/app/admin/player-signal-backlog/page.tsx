import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { updatePlayerSignalBacklogStatus } from './actions'

const SOURCES = ['share_your_signal', 'site_signal_nav', 'certification'] as const

/**
 * @page /admin/player-signal-backlog
 * @entity SYSTEM
 * @description Durable player feedback (Share Your Signal, nav site-signal, cert reports) as K-space BacklogItem rows
 * @permissions admin
 */

export default async function PlayerSignalBacklogPage() {
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

  const rows = await db.backlogItem.findMany({
    where: { source: { in: [...SOURCES] } },
    orderBy: { createdAt: 'desc' },
    take: 300,
    include: {
      submittedBy: { select: { id: true, name: true } },
    },
  })

  return (
    <div className="min-h-screen bg-black text-zinc-200 p-6 sm:p-10 max-w-5xl mx-auto space-y-6">
      <div>
        <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300 block mb-2">
          ← Admin
        </Link>
        <h1 className="text-2xl font-bold text-white">Player signal backlog</h1>
        <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
          Submissions from Share Your Signal (quest), global nav report, and certification feedback. Stored in{' '}
          <code className="text-fuchsia-400/80">backlog_items</code> for production durability. JSONL mirror is best-effort
          on local disk only.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-zinc-500 text-sm">No rows yet for these sources.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3 text-sm"
            >
              <div className="flex flex-wrap justify-between gap-2 text-xs text-zinc-500">
                <span className="font-mono text-fuchsia-400/80">{row.source}</span>
                <span>
                  {new Date(row.createdAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <p className="text-zinc-100 font-medium">{row.title}</p>
              <p className="text-zinc-400 text-xs whitespace-pre-wrap max-h-48 overflow-y-auto border border-zinc-800/80 rounded p-2 bg-black/40">
                {row.description}
              </p>
              <p className="text-xs text-zinc-500">
                From{' '}
                {row.submittedBy ? (
                  <span className="text-zinc-300">{row.submittedBy.name}</span>
                ) : (
                  <span className="italic">unknown</span>
                )}{' '}
                · severity <span className="text-zinc-400">{row.severity}</span> · area{' '}
                <span className="text-zinc-400">{row.area}</span>
              </p>
              <form action={updatePlayerSignalBacklogStatus} className="flex flex-wrap items-center gap-2 text-xs">
                <input type="hidden" name="id" value={row.id} />
                <label className="text-zinc-500">Status</label>
                <select
                  name="status"
                  defaultValue={row.status}
                  className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-200"
                >
                  <option value="new">new</option>
                  <option value="triaged">triaged</option>
                  <option value="in_progress">in_progress</option>
                  <option value="done">done</option>
                  <option value="wontfix">wontfix</option>
                </select>
                <button
                  type="submit"
                  className="rounded border border-zinc-600 px-2 py-1 text-zinc-300 hover:bg-zinc-800"
                >
                  Save
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
