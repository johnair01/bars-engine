import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { StarterQuestBoard } from '@/components/StarterQuestBoard'
import { CreateBarForm } from '@/components/CreateBarForm'
import { FaceMovesSection } from '@/components/hand/FaceMovesSection'
import Link from 'next/link'

export default async function HandPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/conclave/guided')
    if (!isGameAccountReady(player)) redirect('/conclave/guided')

    const playerId = player.id

    // Unassigned Private Drafts (Created by me, Private, Unclaimed)
    const privateDrafts = await db.customBar.findMany({
        where: {
            creatorId: playerId,
            visibility: 'private',
            claimedById: null,
            status: 'active'
        },
        orderBy: { createdAt: 'desc' }
    })

    // Active Quests (Claimed by me) -> Already shown on dashboard, but good to focus here
    const activeQuests = await db.playerQuest.findMany({
        where: {
            playerId,
            status: 'assigned'
        },
        include: { quest: true }
    })

    // Convert to IDs for the board component
    const activeQuestIds = activeQuests.map(pq => pq.questId)

    // Completed for reference
    const completedQuests = await db.playerQuest.findMany({
        where: { playerId, status: 'completed' }
    })
    const completedParams = completedQuests.map(q => ({
        id: q.questId,
        inputs: q.inputs ? JSON.parse(q.inputs) : {}
    }))

    // Combined list for the board: 
    // We want to show "Private Drafts" specifically. 
    // The "StarterQuestBoard" takes `customBars`.
    // We'll pass our private drafts.

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
            <header>
                <Link href="/" className="text-zinc-500 hover:text-white text-sm">← Back to Dashboard</Link>
                <h1 className="text-3xl font-bold text-white mt-2">Quest Wallet</h1>
                <p className="text-zinc-400">Organize your active quests and private drafts.</p>
                <div className="flex gap-3 mt-3">
                    <Link href="/hand/deck" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-sm text-purple-400 hover:text-purple-300 hover:border-purple-800/50 transition-colors">
                        🃏 Daily Hand
                    </Link>
                    <Link href="/hand/moves" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-sm text-amber-400 hover:text-amber-300 hover:border-amber-800/50 transition-colors">
                        ⚔️ Moves Library
                    </Link>
                </div>
            </header>

            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-px bg-zinc-800 flex-1"></div>
                    <h2 className="text-purple-500 uppercase tracking-widest text-sm font-bold">Private Drafts</h2>
                    <div className="h-px bg-zinc-800 flex-1"></div>
                </div>

                {privateDrafts.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                        <p className="text-zinc-500 mb-4">No private drafts yet.</p>
                        <div className="max-w-xs mx-auto">
                            <CreateBarForm />
                        </div>
                    </div>
                ) : (
                    <StarterQuestBoard
                        completedBars={[]}
                        activeBars={[]}
                        customBars={privateDrafts}
                        ichingBars={[]}
                        view="available" // Render as cards we can interact with (edit/assign?)
                    />
                )}
            </section>

            <FaceMovesSection />

            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-px bg-zinc-800 flex-1"></div>
                    <h2 className="text-yellow-500 uppercase tracking-widest text-sm font-bold">Active Assignments</h2>
                    <div className="h-px bg-zinc-800 flex-1"></div>
                </div>
                {/* 
                     We reuse the logic from dashboard:
                     We need to fetch the CustomBar objects for these active quests to render them.
                 */}
                {/* <ActiveQuestList ... /> */}
                <div className="text-zinc-500 text-sm italic">
                    (Your active assigned quests active are shown on the main dashboard)
                </div>
            </section>
        </div>
    )
}
