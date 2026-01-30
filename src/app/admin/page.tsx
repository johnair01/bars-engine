import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
    const player = await getCurrentPlayer()
    if (!player) return redirect('/invite/ANTIGRAVITY')

    // Check Role (ENGINEER is Admin for MVP)
    const isAdmin = player.roles.some((r: any) => r.role.key === 'ENGINEER')
    if (!isAdmin) {
        return <div className="p-8 text-red-500 font-mono">ACCESS DENIED. SIGNAL UNVERIFIED.</div>
    }

    // Fetch Data
    const players = await db.player.findMany({
        include: {
            invite: true,
            roles: { include: { role: true } },
            bars: { include: { bar: true } },
            _count: { select: { vibulonEvents: true, quests: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    })

    return (
        <div className="min-h-screen bg-zinc-950 text-emerald-400 p-8 font-mono text-sm">
            <h1 className="text-2xl font-bold mb-8 text-emerald-500 border-b border-emerald-900 pb-2">
                ANTIGRAVITY // ENGINE CONTROL ({players.length})
            </h1>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-emerald-700 uppercase tracking-widest border-b border-emerald-900/50">
                        <tr>
                            <th className="pb-4">Name</th>
                            <th className="pb-4">Contact</th>
                            <th className="pb-4">Role</th>
                            <th className="pb-4">State (Bar)</th>
                            <th className="pb-4">Vibulons</th>
                            <th className="pb-4">Invited</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/30">
                        {players.map((p: any) => (
                            <tr key={p.id} className="hover:bg-emerald-900/10">
                                <td className="py-2">{p.name}</td>
                                <td className="py-2 opacity-50">{p.contactValue}</td>
                                <td className="py-2">{p.roles.map((r: any) => r.role.key).join(', ')}</td>
                                <td className="py-2">{p.bars[0]?.bar.name || '-'}</td>
                                <td className="py-2">{p._count.vibulonEvents}</td>
                                <td className="py-2 opacity-50 text-xs">{p.invite.token}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
