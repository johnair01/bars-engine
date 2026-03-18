import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getBarDetail, getBarRecipients } from '@/actions/bars'
import Link from 'next/link'
import { SendBarForm } from './SendBarForm'
import { ShareOutsideForm } from './ShareOutsideForm'
import { BarPhotoForm } from '@/components/bars/BarPhotoForm'
import { BarDetailClient } from './BarDetailClient'
import { BarFaceBackTabs } from '@/components/bars/BarFaceBackTabs'
import { GrowFromBar } from '@/components/bars/GrowFromBar'

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

    const { bar, isOwner, isRecipient, recipientShare } = result
    const tags = bar.storyContent ? bar.storyContent.split(',').map(t => t.trim()).filter(Boolean) : []

    // Fetch recipients for the send form (only if owner)
    const recipients = isOwner ? await getBarRecipients() : []

    return (
        <BarDetailClient bar={bar} isOwner={isOwner} isRecipient={isRecipient} recipientShare={recipientShare ?? null}>
        <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Provenance badges */}
                {(bar.collapsedFromQuest || bar.collapsedFromInstance) && (
                    <div className="flex flex-wrap gap-2">
                        {bar.collapsedFromQuest && (
                            <Link
                                href={`/?focusQuest=${bar.collapsedFromQuest.id}`}
                                className="text-xs bg-purple-900/40 text-purple-300 px-3 py-1 rounded-full hover:bg-purple-800/50 transition-colors"
                            >
                                From quest: {bar.collapsedFromQuest.title?.slice(0, 30)}{bar.collapsedFromQuest.title && bar.collapsedFromQuest.title.length > 30 ? '…' : ''}
                            </Link>
                        )}
                        {bar.collapsedFromInstance && (
                            <Link
                                href={`/campaigns/landing/${bar.collapsedFromInstance.slug}`}
                                className="text-xs bg-amber-900/40 text-amber-300 px-3 py-1 rounded-full hover:bg-amber-800/50 transition-colors"
                            >
                                From campaign: {bar.collapsedFromInstance.name}
                            </Link>
                        )}
                    </div>
                )}

                {/* Back + meta */}
                <div className="flex items-center gap-4">
                    <Link href="/bars" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors text-sm">
                        ←
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>by {bar.creator.name}{bar.proposedByAgentId ? ' (simulated)' : ''}</span>
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

                {/* Card: Face | Back */}
                <BarFaceBackTabs
                    description={bar.description}
                    imageUrl={bar.assets?.find((a) => a.mimeType?.startsWith('image/'))?.url}
                    tags={tags}
                    isOwner={isOwner}
                    barId={bar.id}
                />

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

                {/* Grow from this BAR (owner or recipient) */}
                {(isOwner || isRecipient) && bar.type === 'bar' && (
                    <GrowFromBar barId={bar.id} />
                )}

                {/* Add photo (owner only) */}
                {isOwner && (
                    <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                        <BarPhotoForm customBarId={bar.id} assets={bar.assets ?? []} />
                    </section>
                )}

                {/* Send BAR (owner only) */}
                {isOwner && (
                    <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            Share as talisman
                        </h2>
                        <SendBarForm barId={bar.id} recipients={recipients} />
                    </section>
                )}

                {/* Share outside the game (owner only) */}
                {isOwner && (
                    <section className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-6">
                        <h2 className="text-lg font-bold text-white mb-1">Share outside the game</h2>
                        <p className="text-zinc-400 text-sm mb-4">
                            Send this BAR to someone who isn&apos;t in the game yet. They get an invite link — when they sign up, the BAR is delivered to them.
                        </p>
                        <ShareOutsideForm barId={bar.id} />
                    </section>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-zinc-500 pt-4 border-t border-zinc-800">
                    <Link href="/bars" className="hover:text-white transition">Inspirations</Link>
                    <Link href="/library/bars" className="hover:text-white transition">Public BARs</Link>
                </div>
            </div>
        </div>
        </BarDetailClient>
    )
}
