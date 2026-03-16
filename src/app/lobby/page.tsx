import Link from 'next/link'
import { listInstances } from '@/actions/lobby'
import { db } from '@/lib/db'
import { approveExportRequest } from '@/actions/lobby'

export default async function LobbyPage() {
  const instances = await listInstances()
  const pendingExports = await db.instanceExportRequest.findMany({
    where: { status: 'pending' },
    include: {
      instance: { select: { name: true, slug: true } },
      player: { select: { name: true } },
    },
    orderBy: { requestedAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        <header className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Host Console</p>
          <h1 className="text-3xl font-bold text-white">Game Lobby</h1>
          <p className="text-zinc-500 text-sm">All instances running on this deployment.</p>
        </header>

        <div className="flex gap-3">
          <Link
            href="/lobby/new"
            className="px-4 py-2 rounded-lg bg-emerald-800/30 border border-emerald-700/40 text-emerald-300 text-sm font-medium hover:bg-emerald-700/30 transition"
          >
            + Create new instance
          </Link>
        </div>

        {/* Instances */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Active Instances</h2>
          {instances.map((inst) => (
            <div
              key={inst.id}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white">{inst.name}</p>
                  {inst.isEventMode && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-400 border border-purple-700/30">
                      event
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">
                  /{inst.slug} · {inst._count.memberships} members · {inst.domainType}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/lobby/new?copyFrom=${inst.id}`}
                  className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition"
                >
                  Copy + reset
                </Link>
                <Link
                  href={`/admin/instances`}
                  className="px-3 py-1.5 text-xs rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition"
                >
                  Admin →
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* Pending export requests */}
        {pendingExports.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Pending Fork Requests</h2>
            {pendingExports.map((req) => (
              <div key={req.id} className="bg-zinc-900/40 border border-amber-800/30 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-sm text-zinc-200">
                    <span className="font-medium">{req.player.name}</span> wants to fork{' '}
                    <span className="text-amber-300">{req.instance.name}</span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Requested {req.requestedAt.toLocaleDateString()}
                  </p>
                </div>
                <form
                  action={async () => {
                    'use server'
                    await approveExportRequest(req.id)
                  }}
                >
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs rounded-lg bg-amber-900/30 border border-amber-700/40 text-amber-300 hover:bg-amber-800/40 transition"
                  >
                    Approve + generate config
                  </button>
                </form>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
