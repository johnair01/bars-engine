import Link from 'next/link'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { LibraryRequestButton } from '@/components/LibraryRequestButton'

/**
 * @page /docs
 * @entity WIKI
 * @description Player handbook index - documentation built from library requests and community evidence
 * @permissions public (read-only)
 * @relationships lists all DocNode entries (canonical, validated, draft), supports LibraryRequest creation
 * @energyCost 0 (read-only documentation index)
 * @dimensions WHO:viewer, WHAT:WIKI, WHERE:knowledge_base, ENERGY:learning, PERSONAL_THROUGHPUT:wake_up
 * @example /docs
 * @agentDiscoverable true
 */
export default async function DocsIndexPage() {
    const [nodes, player] = await Promise.all([
        db.docNode.findMany({
        where: {
            canonicalStatus: { in: ['canonical', 'validated', 'draft'] },
            scope: { not: 'deprecated' }
        },
        orderBy: { title: 'asc' }
        }),
        getCurrentPlayer()
    ])

    const byType = nodes.reduce<Record<string, typeof nodes>>((acc, n) => {
        const t = n.nodeType || 'other'
        if (!acc[t]) acc[t] = []
        acc[t].push(n)
        return acc
    }, {})

    const typeOrder = ['handbook', 'codex', 'lore', 'request_record', 'other']

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
            <div className="max-w-3xl mx-auto space-y-8">
                <header className="space-y-2">
                    <Link href="/wiki" className="text-sm text-zinc-500 hover:text-white">
                        ← Knowledge Base
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Player Handbook</h1>
                    <p className="text-zinc-500 text-sm">
                        Documentation built from Library Requests and community evidence.
                    </p>
                </header>

                {nodes.length === 0 ? (
                    <div className="text-zinc-500 italic py-12 text-center border border-dashed border-zinc-800 rounded-xl">
                        No docs yet. Submit a Library Request from the dashboard to get started.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {typeOrder.map((type) => {
                            const list = byType[type]
                            if (!list?.length) return null
                            return (
                                <section key={type} className="space-y-2">
                                    <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-bold">
                                        {type.replace('_', ' ')}
                                    </h2>
                                    <ul className="space-y-2">
                                        {list.map((n) => (
                                            <li key={n.id}>
                                                <Link
                                                    href={`/docs/${n.slug}`}
                                                    className="text-zinc-200 hover:text-white font-medium transition"
                                                >
                                                    {n.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )
                        })}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-zinc-800">
                    <span className="text-sm text-zinc-500">Can&apos;t find what you need?</span>
                    {player ? (
                        <LibraryRequestButton />
                    ) : (
                        <Link
                            href="/login?redirect=/docs"
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium"
                        >
                            Log in to ask
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
