import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { StarterQuestBoard } from '@/components/StarterQuestBoard'
import { CreateBarForm } from '@/components/CreateBarForm'
import { BarWalletManager } from '@/components/BarWalletManager'
import Link from 'next/link'

export default async function HandPage() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return <div className="p-8 text-white">Please log in.</div>
    }

    // Logged BARs (private inspirations that can be promoted later)
    const loggedBars = await db.customBar.findMany({
        where: {
            creatorId: playerId,
            visibility: 'private',
            status: 'active',
            OR: [
                { barState: 'logged' },
                { type: 'inspiration' } // legacy fallback before barState was introduced
            ]
        },
        select: {
            id: true,
            title: true,
            description: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    })

    // Active Quests (Claimed by me)
    const activeQuests = await db.playerQuest.findMany({
        where: {
            playerId,
            status: 'assigned'
        },
        include: { quest: true }
    })

    // Convert to IDs for the board component
    const activeQuestIds = activeQuests.map(pq => pq.questId)
    const activePrivateQuestOptions = activeQuests
        .filter(pq => pq.quest.visibility === 'private' && pq.quest.type !== 'inspiration')
        .map(pq => ({
            id: pq.questId,
            title: pq.quest.title
        }))

    // Completed for reference
    const completedQuests = await db.playerQuest.findMany({
        where: { playerId, status: 'completed' }
    })
    const completedParams = completedQuests.map(q => ({
        id: q.questId,
        inputs: q.inputs ? JSON.parse(q.inputs) : {}
    }))

    // Private quests excluding raw inspiration BARs
    const privateQuests = await db.customBar.findMany({
        where: {
            creatorId: playerId,
            visibility: 'private',
            status: 'active',
            type: { not: 'inspiration' }
        },
        orderBy: { createdAt: 'desc' }
    })

    const consumedModifierBars = await db.customBar.findMany({
        where: {
            creatorId: playerId,
            barState: 'consumed',
            storyPath: 'modifier',
        },
        select: {
            id: true,
            title: true,
            parentId: true,
            storyContent: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 12
    })

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
            <header>
                <Link href="/" className="text-zinc-500 hover:text-white text-sm">← Back to Dashboard</Link>
                <h1 className="text-3xl font-bold text-white mt-2">Your Hand</h1>
                <p className="text-zinc-400">Manage your private quests and active commitments.</p>
            </header>

            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-px bg-zinc-800 flex-1"></div>
                    <h2 className="text-pink-500 uppercase tracking-widest text-sm font-bold">BAR Wallet</h2>
                    <div className="h-px bg-zinc-800 flex-1"></div>
                </div>

                <p className="text-sm text-zinc-500">
                    Log inspiration BARs from life or party moments. Promote a BAR into a private quest when you are ready.
                </p>
                <BarWalletManager bars={loggedBars} activeQuestOptions={activePrivateQuestOptions} />
            </section>

            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-px bg-zinc-800 flex-1"></div>
                    <h2 className="text-yellow-500 uppercase tracking-widest text-sm font-bold">Private Quests</h2>
                    <div className="h-px bg-zinc-800 flex-1"></div>
                </div>
                {privateQuests.length === 0 ? (
                    <div className="text-zinc-500 text-sm italic">
                        No private quests yet. Promote a BAR above or create one directly.
                    </div>
                ) : (
                    <StarterQuestBoard
                        completedBars={completedParams}
                        activeBars={activeQuestIds}
                        customBars={privateQuests}
                        view="active"
                    />
                )}
            </section>

            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-px bg-zinc-800 flex-1"></div>
                    <h2 className="text-purple-500 uppercase tracking-widest text-sm font-bold">Direct Quest Creator</h2>
                    <div className="h-px bg-zinc-800 flex-1"></div>
                </div>
                <CreateBarForm />
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-px bg-zinc-800 flex-1"></div>
                    <h2 className="text-cyan-500 uppercase tracking-widest text-sm font-bold">Modifier Lineage</h2>
                    <div className="h-px bg-zinc-800 flex-1"></div>
                </div>
                {consumedModifierBars.length === 0 ? (
                    <div className="text-zinc-600 text-sm italic">No consumed modifier BARs yet.</div>
                ) : (
                    <div className="space-y-2">
                        {consumedModifierBars.map((bar) => (
                            <div key={bar.id} className="rounded-lg border border-zinc-800 bg-zinc-900/20 p-3">
                                <div className="text-sm text-cyan-200 font-semibold">{bar.title}</div>
                                <div className="text-xs text-zinc-500 mt-1">
                                    Applied to quest: <span className="font-mono text-zinc-400">{bar.parentId || 'unknown'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
