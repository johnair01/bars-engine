import Link from 'next/link'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const node = await db.docNode.findUnique({
        where: { slug }
    })

    if (!node) notFound()

    // For request_record stubs: find linked DocQuest so players can complete evidence
    const linkedBacklog = node.nodeType === 'request_record'
        ? await db.backlogItem.findFirst({
              where: { linkedDocNodeId: node.id },
              select: { linkedDocQuestId: true }
          })
        : null
    const docQuestId = linkedBacklog?.linkedDocQuestId ?? null

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
            <div className="max-w-3xl mx-auto space-y-6">
                <header className="space-y-2">
                    <Link href="/wiki" className="text-sm text-zinc-500 hover:text-white">
                        ← Knowledge Base
                    </Link>
                    <div className="flex items-center gap-2">
                        <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                                node.canonicalStatus === 'canonical'
                                    ? 'bg-emerald-900/30 text-emerald-400'
                                    : node.canonicalStatus === 'validated'
                                      ? 'bg-purple-900/30 text-purple-400'
                                      : 'bg-zinc-800 text-zinc-400'
                            }`}
                        >
                            {node.canonicalStatus}
                        </span>
                        <span className="text-xs text-zinc-500">{node.nodeType}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">{node.title}</h1>
                </header>

                <article className="prose prose-invert prose-lg max-w-none">
                    {node.bodyRst ? (
                        <ReactMarkdown>{node.bodyRst}</ReactMarkdown>
                    ) : (
                        <p className="text-zinc-500 italic">No content yet. This doc is being built from evidence.</p>
                    )}
                </article>

                {docQuestId && (
                    <div className="bg-purple-950/30 border border-purple-900/50 rounded-lg p-4">
                        <p className="text-purple-200 font-medium mb-2">Help document this</p>
                        <p className="text-sm text-zinc-400 mb-3">
                            Complete the DocQuest to submit evidence (observations, instructions, or canon statements) and build this answer.
                        </p>
                        <Link
                            href={`/#active-quests`}
                            className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-lg"
                        >
                            Open DocQuest →
                        </Link>
                    </div>
                )}

                <footer className="pt-8 border-t border-zinc-800 text-xs text-zinc-500">
                    <Link href="/wiki" className="hover:text-zinc-300">
                        Back to Knowledge Base
                    </Link>
                </footer>
            </div>
        </div>
    )
}
