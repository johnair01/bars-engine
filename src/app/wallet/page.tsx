import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { getWallet, transferVibulons } from '@/actions/economy'
import { redirect } from 'next/navigation'

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

                <form action={transferVibulons} className="space-y-4">
                    <input type="hidden" name="senderId" value={playerId} />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-zinc-500 font-mono">Recipient</label>
                            <select name="targetId" className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white" required>
                                <option value="">Select Player...</option>
                                {others.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs uppercase text-zinc-500 font-mono">Amount</label>
                            <input
                                type="number"
                                name="amount"
                                min="1"
                                max={total}
                                defaultValue="1"
                                className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition"
                        disabled={total === 0}
                    >
                        Send Vibulons
                    </button>
                    {total === 0 && <p className="text-center text-xs text-red-400">You need Vibulons to send them.</p>}
                </form>
            </section>

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
