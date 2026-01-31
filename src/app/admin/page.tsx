import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export default async function AdminPage() {
    // Fetch data
    const players = await db.player.findMany({
        include: {
            roles: { include: { role: true } },
            quests: { include: { quest: true } },
            vibulonEvents: true,
        },
        orderBy: { createdAt: 'desc' }
    })

    // Calculate Vibulons
    const playersWithBalance = players.map(p => ({
        ...p,
        balance: p.vibulonEvents.reduce((acc, e) => acc + e.amount, 0)
    }))

    const quests = await db.quest.findMany()

    // --- ACTIONS ---
    async function grantVibulon(formData: FormData) {
        'use server'
        const playerId = formData.get('playerId') as string
        const amount = Number(formData.get('amount'))
        await db.vibulonEvent.create({
            data: {
                playerId,
                amount,
                source: 'admin',
                notes: 'Manual Grant'
            }
        })
        revalidatePath('/admin')
    }

    async function assignQuest(formData: FormData) {
        'use server'
        const playerId = formData.get('playerId') as string
        const questId = formData.get('questId') as string
        await db.playerQuest.create({
            data: { playerId, questId }
        })
        revalidatePath('/admin')
    }

    return (
        <div className="min-h-screen bg-black text-xs text-zinc-400 font-mono p-8">
            <h1 className="text-xl text-white mb-8 border-b border-zinc-800 pb-2">BARS ENGINE // ADMIN CONSOLE</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* PLAYERS LIST */}
                <div className="space-y-4">
                    <h2 className="text-zinc-500 uppercase tracking-widest">Active Players ({players.length})</h2>
                    <div className="divide-y divide-zinc-900 border border-zinc-900 rounded">
                        {playersWithBalance.map(player => (
                            <div key={player.id} className="p-4 hover:bg-zinc-900/50 transition">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-white font-bold text-sm">{player.name}</div>
                                        <div>{player.contactValue} ({player.contactType})</div>
                                        <div className="mt-1 text-purple-400">ROLE: {player.roles.map(r => r.role.displayName).join(', ') || 'N/A'}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-400 text-lg">{player.balance} ✺</div>
                                        <div className="text-zinc-600 truncate w-24" title={player.id}>{player.id}</div>
                                    </div>
                                </div>

                                {/* CONTROLS */}
                                <div className="flex gap-2 mt-4 bg-zinc-950 p-2 rounded">
                                    <form action={grantVibulon} className="flex gap-1">
                                        <input type="hidden" name="playerId" value={player.id} />
                                        <input name="amount" type="number" defaultValue={1} className="w-12 bg-zinc-800 border-none rounded px-1" />
                                        <button className="bg-zinc-800 hover:bg-zinc-700 px-2 rounded text-white">+V</button>
                                    </form>

                                    <form action={assignQuest} className="flex gap-1">
                                        <input type="hidden" name="playerId" value={player.id} />
                                        <select name="questId" className="w-24 bg-zinc-800 border-none rounded px-1">
                                            {quests.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                                        </select>
                                        <button className="bg-zinc-800 hover:bg-zinc-700 px-2 rounded text-white">+Q</button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SYSTEM STATS / QUESTS */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-zinc-500 uppercase tracking-widest mb-4">Quest Library</h2>
                        <ul className="space-y-2">
                            {quests.map(q => (
                                <li key={q.id} className="p-2 border border-zinc-900 rounded">
                                    <div className="text-white font-bold">{q.title}</div>
                                    <div className="italic opacity-50">{q.prompt}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
