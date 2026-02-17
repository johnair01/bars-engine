import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getBarDetail, getBarRecipients } from '@/actions/bars'
import Link from 'next/link'
import { SendBarForm } from './SendBarForm'

export default async function BarDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')

    const result = await getBarDetail(id)

    if ('error' in result) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-4xl">🚫</div>
                    <p className="text-red-400 font-bold">{result.error}</p>
                    <Link href="/bars" className="text-zinc-500 hover:text-white text-sm">← Back to BARs</Link>
                </div>
            </div>
        )
    }

    const { bar, isOwner, isRecipient } = result
    const tags = bar.storyContent ? bar.storyContent.split(',').map(t => t.trim()).filter(Boolean) : []

    // Fetch recipients for the send form (only if owner)
    const recipients = isOwner ? await getBarRecipients() : []

    return (
        <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/bars" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors text-sm">
                        ←
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-white truncate">{bar.title}</h1>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                            <span>by {bar.creator.name}</span>
                            <span>&middot;</span>
                            <span>{new Date(bar.createdAt).toLocaleDateString()}</span>
                            {isOwner && (
                                <span className="bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded-full">Owner</span>
                            )}
                            {isRecipient && !isOwner && (
                                <span className="bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">Received</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag, i) => (
                            <span key={i} className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                    <div className="prose prose-invert prose-sm max-w-none">
                        <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed">{bar.description}</p>
                    </div>
                </div>

                {/* Share History */}
                {bar.shares.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-px bg-zinc-800 flex-1"></div>
                            <h2 className="text-zinc-600 uppercase tracking-widest text-xs font-bold">
                                Share History
                            </h2>
                            <div className="h-px bg-zinc-800 flex-1"></div>
                        </div>
                        <div className="space-y-2">
                            {bar.shares.map((share) => (
                                <div key={share.id} className="text-xs text-zinc-500 bg-zinc-900/30 rounded-lg px-3 py-2 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="text-zinc-400">{share.fromUser.name}</span>
                                        <span>→</span>
                                        <span className="text-zinc-400">{share.toUser.name}</span>
                                        <span className="ml-auto text-zinc-600">
                                            {new Date(share.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {share.note && (
                                        <div className="text-[11px] text-zinc-600 border-l-2 border-zinc-700/60 pl-3 line-clamp-2">
                                            <span className="text-[10px] uppercase tracking-widest text-zinc-700 mr-2">Note</span>
                                            {share.note}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Send BAR (owner only) */}
                {isOwner && (
                    <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            Send this BAR
                        </h2>
                        <SendBarForm barId={bar.id} recipients={recipients} />
                    </section>
                )}
            </div>
        </div>
    )
}
