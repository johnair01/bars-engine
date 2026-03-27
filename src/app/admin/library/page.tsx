import Link from 'next/link'
import { db } from '@/lib/db'

/**
 * @page /admin/library
 * @entity WIKI
 * @description Player help requests - resolve to doc node or spawn BacklogItem + DocQuest
 * @permissions admin
 * @relationships LINKED_TO (doc nodes, doc quests, backlog items)
 * @dimensions WHO:admin+player, WHAT:WIKI, PERSONAL_THROUGHPUT:clean-up
 * @example /admin/library
 * @agentDiscoverable false
 */
export default async function AdminLibraryPage() {
    const requests = await db.libraryRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            createdBy: { select: { name: true } },
            resolvedDocNode: { select: { slug: true, title: true } },
            spawnedDocQuest: { select: { id: true, title: true } }
        }
    })

    const statusCounts = {
        new: requests.filter((r) => r.status === 'new').length,
        resolved: requests.filter((r) => r.status === 'resolved').length,
        spawned: requests.filter((r) => r.status === 'spawned').length,
        closed: requests.filter((r) => r.status === 'closed').length
    }

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans space-y-10 ml-0 sm:ml-64 transition-all duration-300">
            <header className="space-y-2">
                <Link href="/admin" className="text-sm text-zinc-500 hover:text-white">
                    ← Back to Admin
                </Link>
                <h1 className="text-3xl font-bold text-white">Library Requests</h1>
                <p className="text-zinc-500">
                    Player requests for help. Resolved = linked to doc. Spawned = BacklogItem + DocQuest created.
                </p>
            </header>

            <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                <div className="flex gap-4 text-sm">
                    <span className="text-zinc-400">New: {statusCounts.new}</span>
                    <span className="text-emerald-400">Resolved: {statusCounts.resolved}</span>
                    <span className="text-purple-400">Spawned: {statusCounts.spawned}</span>
                    <span className="text-zinc-500">Closed: {statusCounts.closed}</span>
                </div>
            </section>

            <section className="space-y-3">
                {requests.length === 0 ? (
                    <div className="text-zinc-500 italic border border-dashed border-zinc-800 rounded-xl p-6">
                        No library requests yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {requests.map((r) => (
                            <div
                                key={r.id}
                                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{r.requestText}</p>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        {r.createdBy.name} · {r.requestType} · {new Date(r.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span
                                        className={`text-xs font-bold px-2 py-1 rounded ${
                                            r.status === 'resolved'
                                                ? 'bg-emerald-900/30 text-emerald-400'
                                                : r.status === 'spawned'
                                                  ? 'bg-purple-900/30 text-purple-400'
                                                  : 'bg-zinc-800 text-zinc-400'
                                        }`}
                                    >
                                        {r.status}
                                    </span>
                                    {r.resolvedDocNode && (
                                        <Link
                                            href={`/docs/${r.resolvedDocNode.slug}`}
                                            className="text-xs text-emerald-400 hover:text-emerald-300"
                                        >
                                            View doc →
                                        </Link>
                                    )}
                                    {r.spawnedDocQuest && (
                                        <Link
                                            href={`/adventures?quest=${r.spawnedDocQuest.id}`}
                                            className="text-xs text-purple-400 hover:text-purple-300"
                                        >
                                            View quest →
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
