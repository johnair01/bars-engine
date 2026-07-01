import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { listReceivedBars, listSentBars } from '@/actions/bars'
import { getVaultInventory } from '@/actions/vault'
import { BarListThumb } from '@/components/bars/BarListThumb'

/**
 * @page /vault/all
 * @entity BAR
 * @description Canonical "All BARs" Vault room — every owned active BAR and quest in one list, plus received/sent talismans. The /bars "Inspirations" page folds in here (QLA Phase 1).
 * @permissions authenticated
 * @energyCost 0 (read-only)
 * @dimensions WHO:currentPlayer, WHAT:BAR+QUEST, WHERE:vault
 * @relationships owned inventory (bars + quests), received/sent talismans
 * @example /vault/all
 * @agentDiscoverable false
 */
export default async function VaultAllBarsPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')

    const [inventory, received, sent] = await Promise.all([
        getVaultInventory(),
        listReceivedBars(),
        listSentBars(),
    ])

    const items = 'error' in inventory ? [] : inventory.items
    const total = 'error' in inventory ? 0 : inventory.total
    const hasMore = 'error' in inventory ? false : inventory.hasMore
    const loadError = 'error' in inventory ? inventory.error : null

    return (
        <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/vault" className="text-sm text-zinc-500 hover:text-white transition">← Vault</Link>
                        <h1 className="text-3xl font-bold text-white mt-1">All BARs</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">Everything you hold — seeds and quests in one place.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/bars/feed"
                            className="px-4 py-2 border border-zinc-700 hover:border-amber-600/50 text-amber-400/90 hover:text-amber-300 font-medium rounded-lg transition"
                        >
                            BAR Feed
                        </Link>
                        <Link
                            href="/bars/capture"
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition shadow-lg shadow-purple-900/20"
                        >
                            + Capture
                        </Link>
                    </div>
                </div>

                {loadError && (
                    <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                        {loadError}
                    </div>
                )}

                {/* ---- INBOX (Received talismans) ---- */}
                {received.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px bg-zinc-800 flex-1"></div>
                            <h2 className="text-green-500/80 uppercase tracking-widest text-sm font-bold">
                                Talismans ({received.length})
                            </h2>
                            <div className="h-px bg-zinc-800 flex-1"></div>
                        </div>

                        <div className="space-y-3">
                            {received.map((share) => {
                                const isUnviewed = !share.viewedAt
                                return (
                                <Link key={share.id} href={`/bars/${share.bar.id}`} className="block group">
                                    <div className={`rounded-xl p-4 transition-colors ${
                                        isUnviewed
                                            ? 'bg-green-950/30 border-2 border-green-700/60 hover:border-green-600/70'
                                            : 'bg-zinc-900/50 border border-green-900/40 hover:border-green-600/50'
                                    }`}>
                                        <div className="flex justify-between items-start gap-3">
                                            <BarListThumb assets={share.bar.assets ?? []} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-zinc-200 text-sm line-clamp-2 group-hover:text-green-400/90 transition-colors font-mono">
                                                    {share.bar.description}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="flex items-center gap-2 justify-end">
                                                    {isUnviewed && (
                                                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Unviewed" />
                                                    )}
                                                    <span className="text-xs text-green-400 font-bold">From {share.fromUser.name}</span>
                                                </div>
                                                <div className="text-xs text-zinc-600 mt-1">
                                                    {new Date(share.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        {share.note && (
                                            <div className="mt-3 text-xs text-green-200/80 border-l-2 border-green-900/60 pl-3 line-clamp-2">
                                                <span className="text-[10px] uppercase tracking-widest text-zinc-600 mr-2">Note</span>
                                                {share.note}
                                            </div>
                                        )}
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
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* ---- MY INVENTORY (owned BARs + quests) ---- */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-px bg-zinc-800 flex-1"></div>
                        <h2 className="text-purple-500/80 uppercase tracking-widest text-sm font-bold">
                            Your BARs ({total})
                        </h2>
                        <div className="h-px bg-zinc-800 flex-1"></div>
                    </div>

                    {items.length === 0 && !loadError ? (
                        <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                            <p className="text-zinc-500 mb-3">No BARs yet.</p>
                            <p className="text-zinc-600 text-sm mb-4">Capture a spark—it can grow into a quest or become a talisman for another.</p>
                            <Link href="/bars/capture" className="text-purple-400 hover:text-purple-300 font-bold">
                                Capture your first BAR →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((bar) => (
                                <Link key={bar.id} href={`/bars/${bar.id}`} className="block group">
                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-purple-600/50 transition-colors">
                                        <div className="flex justify-between items-start gap-3">
                                            <BarListThumb assets={bar.assets ?? []} />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-zinc-200 text-sm line-clamp-2 group-hover:text-purple-400/90 transition-colors font-mono">
                                                    {bar.description || bar.title}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                {bar.type === 'quest' && (
                                                    <span className="text-[10px] uppercase tracking-widest text-amber-400/90 font-bold">Quest</span>
                                                )}
                                                <div className="text-xs text-zinc-600 mt-1">
                                                    {new Date(bar.createdAt).toLocaleDateString()}
                                                </div>
                                                {bar.shareCount > 0 && (
                                                    <div className="text-xs text-purple-400 mt-1">
                                                        Shared {bar.shareCount}x
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
                            {hasMore && (
                                <p className="text-center text-xs text-zinc-600 pt-2">
                                    Showing the {items.length} most recent of {total}. Older BARs stay in your move-rooms.
                                </p>
                            )}
                        </div>
                    )}
                </section>

                {/* ---- SENT talismans ---- */}
                {sent.length > 0 && (
                    <section className="opacity-70 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-px bg-zinc-800 flex-1"></div>
                            <h2 className="text-zinc-600 uppercase tracking-widest text-sm font-bold">
                                Shared forth ({sent.length})
                            </h2>
                            <div className="h-px bg-zinc-800 flex-1"></div>
                        </div>

                        <div className="space-y-2">
                            {sent.map((share) => (
                                <div key={share.id} className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-3 space-y-1">
                                    <div className="flex justify-between items-center gap-3">
                                        <div className="min-w-0 flex-1">
                                            <Link href={`/bars/${share.bar.id}`} className="text-zinc-200 text-sm font-mono line-clamp-2 hover:text-purple-400 transition-colors block">
                                                {share.bar.description}
                                            </Link>
                                        </div>
                                        <div className="text-xs text-zinc-600 shrink-0">
                                            → {share.toUser.name} &middot; {new Date(share.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    {share.note && (
                                        <div className="text-xs text-zinc-500 line-clamp-2">
                                            <span className="text-[10px] uppercase tracking-widest text-zinc-700 mr-2">Note</span>
                                            {share.note}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
