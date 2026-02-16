import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { getWallet } from '@/actions/economy'
import { redirect } from 'next/navigation'
import { VibulonTransfer } from '@/components/VibulonTransfer'

export default async function WalletPage() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        redirect('/')
    }

    const player = await db.player.findUnique({
        where: { id: playerId },
        select: { name: true }
    })

    const wallet = await getWallet(playerId)
    const total = wallet.length

    // Fetch potential recipients
    const others = await db.player.findMany({
        where: { id: { not: playerId } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    })

    // Fetch transfer history (sent and received)
    const transferEvents = await db.vibulonEvent.findMany({
        where: {
            playerId: playerId,
            source: 'p2p_transfer',
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    })

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/" className="text-sm text-zinc-500 hover:text-white transition">← Back to Dashboard</Link>
                    <h1 className="text-3xl font-bold text-white mt-2">Wallet</h1>
                    <div className="text-zinc-500 text-sm font-mono">{player?.name}</div>
                </div>
                <div className="bg-zinc-900/50 px-6 py-4 rounded-xl border border-zinc-800 text-center">
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Total Balance</div>
                    <div className="text-4xl font-mono text-green-400">{total} ♦</div>
                </div>
            </div>

            {/* Transfer Section */}
            <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span>💸 Transfer Vibulons</span>
                </h2>

                <VibulonTransfer
                    playerId={playerId}
                    balance={total}
                    recipients={others}
                />
            </section>

            {/* Transfer History */}
            {transferEvents.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px bg-zinc-800 flex-1"></div>
                        <h2 className="text-zinc-500 uppercase tracking-widest text-sm font-bold">Transfer History</h2>
                        <div className="h-px bg-zinc-800 flex-1"></div>
                    </div>

                    <div className="space-y-2">
                        {transferEvents.map((event) => (
                            <div key={event.id} className={`bg-zinc-900/20 border rounded-lg p-3 flex justify-between items-center ${event.amount > 0 ? 'border-green-900/50' : 'border-red-900/50'}`}>
                                <div>
                                    <div className={`font-mono text-sm ${event.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {event.amount > 0 ? '+' : ''}{event.amount} ♦
                                    </div>
                                    <div className="text-xs text-zinc-500 mt-1">{event.notes}</div>
                                </div>
                                <div className="text-xs text-zinc-600">
                                    {new Date(event.createdAt).toLocaleDateString()} {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Token History */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-px bg-zinc-800 flex-1"></div>
                    <h2 className="text-zinc-500 uppercase tracking-widest text-sm font-bold">Token Inventory</h2>
                    <div className="h-px bg-zinc-800 flex-1"></div>
                </div>

                <div className="space-y-3">
                    {wallet.map((token) => (
                        <div key={token.id} className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-4 flex justify-between items-center group hover:border-zinc-700 transition">
                            <div>
                                <div className="text-green-400 font-mono text-sm mb-1">1 ♦ VIBULON COIN</div>
                                <div className="text-white font-bold">{token.originTitle}</div>
                                <div className="text-xs text-zinc-500 mt-1">Source: {token.originSource} • ID: {token.originId}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-zinc-600 font-mono">{token.id.slice(-8)}</div>
                                <div className="text-xs text-zinc-700 mt-1">
                                    {new Date(token.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}

                    {wallet.length === 0 && (
                        <div className="text-center text-zinc-600 py-12 border border-dashed border-zinc-800 rounded-xl">
                            No Vibulons in wallet. Complete quests to earn them!
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
