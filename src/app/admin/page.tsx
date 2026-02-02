import { db } from '@/lib/db'
import { getGlobalState, advanceClock } from '@/actions/world'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) redirect('/')

    const player = await db.player.findUnique({
        where: { id: playerId },
        include: { roles: { include: { role: true } } }
    })

    // Check for 'admin' role
    const isAdmin = player?.roles.some(r => r.role.key === 'admin')
    if (!isAdmin) {
        redirect('/') // Or show 403
    }

    const globalState = await getGlobalState()
    const history = await db.storyTick.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    })

    // Simple action to call advance
    async function handleAdvance() {
        'use server'
        await advanceClock(1)
        revalidatePath('/admin')
    }

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-8 max-w-4xl mx-auto space-y-12">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">Conclave Admin</h1>
                <div className="text-zinc-500">Story Clock Control</div>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                {/* CLOCK CONTROL */}
                <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Story Clock</div>
                            <div className="text-6xl font-mono text-white">{globalState.storyClock} <span className="text-lg text-zinc-600">/ 64</span></div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Current Act</div>
                            <div className="text-6xl font-mono text-purple-400">{globalState.currentAct} <span className="text-lg text-zinc-600">/ 8</span></div>
                        </div>
                    </div>

                    <form action={handleAdvance}>
                        <button className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded hover:bg-zinc-200 transition">
                            Advance Clock (+1)
                        </button>
                        <p className="text-xs text-center text-zinc-500 mt-2">
                            This will trigger Hexagram #{Math.min(64, globalState.storyClock + 1)} Global Quest
                        </p>
                    </form>
                </section>

                {/* LOGS */}
                <section className="space-y-4">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Recent Ticks</h3>
                    <div className="space-y-2">
                        {history.map(tick => (
                            <div key={tick.id} className="bg-zinc-900/50 p-3 rounded border border-zinc-800 text-sm">
                                <div className="flex justify-between text-zinc-400 text-xs mb-1">
                                    <span>Tick {tick.tickNumber}</span>
                                    <span>{tick.createdAt.toLocaleTimeString()}</span>
                                </div>
                                <div className="text-zinc-200">{tick.description}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
