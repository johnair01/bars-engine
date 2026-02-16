import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { listMyBars, listReceivedBars, listSentBars } from '@/actions/bars'
import Link from 'next/link'

export default async function BarsPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')

    const [myBars, received, sent] = await Promise.all([
        listMyBars(),
        listReceivedBars(),
        listSentBars(),
    ])

    return (
        <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/" className="text-sm text-zinc-500 hover:text-white transition">← Dashboard</Link>
                        <h1 className="text-3xl font-bold text-white mt-1">My BARs</h1>
                    </div>
                    <Link
                        href="/bars/create"
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition shadow-lg shadow-purple-900/20"
                    >
                        + Create BAR
                    </Link>
                </div>

                {/* ---- INBOX (Received BARs) ---- */}
                {received.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px bg-zinc-800 flex-1"></div>
                            <h2 className="text-green-500/80 uppercase tracking-widest text-sm font-bold">
                                Inbox ({received.length})
                            </h2>
                            <div className="h-px bg-zinc-800 flex-1"></div>
                        </div>

                        <div className="space-y-3">
                            {received.map((share) => (
                                <Link key={share.id} href={`/bars/${share.bar.id}`} className="block group">
                                    <div className="bg-zinc-900/50 border border-green-900/40 rounded-xl p-4 hover:border-green-600/50 transition-colors">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-white font-bold truncate group-hover:text-green-400 transition-colors">
                                                    {share.bar.title}
                                                </h3>
                                                <p className="text-zinc-500 text-sm mt-1 line-clamp-2">
                                                    {share.bar.description}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-xs text-green-400 font-bold">From {share.fromUser.name}</div>
                                                <div className="text-xs text-zinc-600 mt-1">
                                                    {new Date(share.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        {share.bar.storyContent && (
                                            <div className="flex gap-1.5 mt-2">
                                                {share.bar.storyContent.split(',').map((tag, i) => (
                                                    <span key={i} className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
                                                        {tag.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ---- MY BARs (Created by me) ---- */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-px bg-zinc-800 flex-1"></div>
                        <h2 className="text-purple-500/80 uppercase tracking-widest text-sm font-bold">
                            My BARs ({myBars.length})
                        </h2>
                        <div className="h-px bg-zinc-800 flex-1"></div>
                    </div>

                    {myBars.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                            <p className="text-zinc-500 mb-3">You haven&apos;t created any BARs yet.</p>
                            <Link href="/bars/create" className="text-purple-400 hover:text-purple-300 font-bold">
                                Create your first BAR →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {myBars.map((bar) => (
                                <Link key={bar.id} href={`/bars/${bar.id}`} className="block group">
                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-purple-600/50 transition-colors">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-white font-bold truncate group-hover:text-purple-400 transition-colors">
                                                    {bar.title}
                                                </h3>
                                                <p className="text-zinc-500 text-sm mt-1 line-clamp-2">
                                                    {bar.description}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-xs text-zinc-600">
                                                    {new Date(bar.createdAt).toLocaleDateString()}
                                                </div>
                                                {bar.shares.length > 0 && (
                                                    <div className="text-xs text-purple-400 mt-1">
                                                        Shared {bar.shares.length}x
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {bar.storyContent && (
                                            <div className="flex gap-1.5 mt-2">
                                                {bar.storyContent.split(',').map((tag, i) => (
                                                    <span key={i} className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
                                                        {tag.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* ---- SENT BARs ---- */}
                {sent.length > 0 && (
                    <section className="opacity-70 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px bg-zinc-800 flex-1"></div>
                            <h2 className="text-zinc-600 uppercase tracking-widest text-sm font-bold">
                                Sent ({sent.length})
                            </h2>
                            <div className="h-px bg-zinc-800 flex-1"></div>
                        </div>

                        <div className="space-y-2">
                            {sent.map((share) => (
                                <div key={share.id} className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-3 flex justify-between items-center">
                                    <div className="min-w-0 flex-1">
                                        <Link href={`/bars/${share.bar.id}`} className="text-white text-sm font-medium hover:text-purple-400 transition-colors truncate block">
                                            {share.bar.title}
                                        </Link>
                                    </div>
                                    <div className="text-xs text-zinc-600 shrink-0 ml-3">
                                        → {share.toUser.name} &middot; {new Date(share.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
