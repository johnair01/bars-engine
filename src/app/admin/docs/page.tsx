import Link from 'next/link'
import { db } from '@/lib/db'
import { PromoteDocButton } from './PromoteDocButton'

export default async function AdminDocsPage() {
    const nodes = await db.docNode.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 100
    })

    const byStatus = {
        draft: nodes.filter((n) => n.canonicalStatus === 'draft'),
        validated: nodes.filter((n) => n.canonicalStatus === 'validated'),
        canonical: nodes.filter((n) => n.canonicalStatus === 'canonical'),
        deprecated: nodes.filter((n) => n.canonicalStatus === 'deprecated')
    }

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans space-y-10 ml-0 sm:ml-64 transition-all duration-300">
            <header className="space-y-2">
                <Link href="/admin" className="text-sm text-zinc-500 hover:text-white">
                    ← Back to Admin
                </Link>
                <h1 className="text-3xl font-bold text-white">Doc Nodes</h1>
                <p className="text-zinc-500">
                    Documentation nodes. Promote validated → canonical. Merge duplicates.
                </p>
            </header>

            <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                <div className="flex gap-4 text-sm">
                    <span>Draft: {byStatus.draft.length}</span>
                    <span className="text-amber-400">Validated: {byStatus.validated.length}</span>
                    <span className="text-emerald-400">Canonical: {byStatus.canonical.length}</span>
                    <span className="text-zinc-500">Deprecated: {byStatus.deprecated.length}</span>
                </div>
            </section>

            <section className="space-y-3">
                {nodes.length === 0 ? (
                    <div className="text-zinc-500 italic border border-dashed border-zinc-800 rounded-xl p-6">
                        No doc nodes yet. Create via Library Request spawn or admin.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {nodes.map((n) => (
                            <div
                                key={n.id}
                                className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <Link href={`/docs/${n.slug}`} className="text-white font-medium hover:text-purple-400 truncate block">
                                        {n.title}
                                    </Link>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        {n.nodeType} · {n.scope} · {n.canonicalStatus}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span
                                        className={`text-xs font-bold px-2 py-1 rounded ${
                                            n.canonicalStatus === 'canonical'
                                                ? 'bg-emerald-900/30 text-emerald-400'
                                                : n.canonicalStatus === 'validated'
                                                  ? 'bg-amber-900/30 text-amber-400'
                                                  : n.canonicalStatus === 'deprecated'
                                                    ? 'bg-zinc-800 text-zinc-500'
                                                    : 'bg-zinc-800 text-zinc-400'
                                        }`}
                                    >
                                        {n.canonicalStatus}
                                    </span>
                                    {n.canonicalStatus === 'validated' && (
                                        <PromoteDocButton nodeId={n.id} />
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
