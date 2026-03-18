import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { StarterQuestBoard } from '@/components/StarterQuestBoard'
import { CreateBarForm } from '@/components/CreateBarForm'
import { FaceMovesSection } from '@/components/hand/FaceMovesSection'
import Link from 'next/link'
import { HandQuestActions } from '@/components/hand/HandQuestActions'

export default async function HandPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/conclave/guided')
    if (!isGameAccountReady(player)) redirect('/conclave/guided')

    const playerId = player.id

    // Charge captures (today + recent)
    const chargeBars = await db.customBar.findMany({
        where: {
            creatorId: playerId,
            type: 'charge_capture',
            status: 'active',
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, title: true, description: true, createdAt: true },
    })

    // Personal quests: created from a BAR (sourceBarId set), not yet a subquest (no parentId),
    // not already in a thread — unplaced quests ready to be routed.
    const personalQuestsRaw = await db.customBar.findMany({
        where: {
            creatorId: playerId,
            type: 'quest',
            sourceBarId: { not: null },
            parentId: null,
            status: 'active',
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, description: true, moveType: true, createdAt: true },
    })

    // Filter out any that are already in a thread
    const inThread = await db.threadQuest.findMany({
        where: { questId: { in: personalQuestsRaw.map(q => q.id) } },
        select: { questId: true },
    })
    const inThreadIds = new Set(inThread.map(t => t.questId))
    const personalQuests = personalQuestsRaw.filter(q => !inThreadIds.has(q.id))

    // Unassigned Private Drafts (Created by me, Private, Unclaimed, not a quest)
    const privateDrafts = await db.customBar.findMany({
        where: {
            creatorId: playerId,
            visibility: 'private',
            claimedById: null,
            status: 'active',
            type: { not: 'quest' },
        },
        orderBy: { createdAt: 'desc' }
    })

    // INV-4: Invitations this player forged that were accepted
    const acceptedInvites = await db.invite.findMany({
        where: { forgerId: playerId, status: 'used' },
        include: { players: { select: { id: true, name: true, createdAt: true } } },
        orderBy: { usedAt: 'desc' },
        take: 20
    })

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
            <header>
                <Link href="/" className="text-zinc-500 hover:text-white text-sm">← Back to Dashboard</Link>
                <h1 className="text-3xl font-bold text-white mt-2">Quest Wallet</h1>
                <p className="text-zinc-400">Organize your active quests and private drafts.</p>
                <div className="flex flex-wrap gap-3 mt-3">
                    <Link href="/hand/deck" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-sm text-purple-400 hover:text-purple-300 hover:border-purple-800/50 transition-colors">
                        🃏 Daily Hand
                    </Link>
                    <Link href="/hand/moves" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-sm text-amber-400 hover:text-amber-300 hover:border-amber-800/50 transition-colors">
                        ⚔️ Moves Library
                    </Link>
                    <Link href="/hand/forge-invitation" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-sm text-emerald-400 hover:text-emerald-300 hover:border-emerald-800/50 transition-colors">
                        ✨ Forge Invitation
                    </Link>
                    <Link href="/capture" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-900/60 text-sm text-rose-400 hover:text-rose-300 hover:border-rose-800/50 transition-colors">
                        ⚡ Capture Charge
                    </Link>
                </div>
            </header>

            {/* Charge Captures */}
            {chargeBars.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-px bg-zinc-800 flex-1"></div>
                        <h2 className="text-rose-500 uppercase tracking-widest text-sm font-bold">Charge Captures</h2>
                        <div className="h-px bg-zinc-800 flex-1"></div>
                    </div>
                    <div className="space-y-2">
                        {chargeBars.map((bar) => (
                            <div key={bar.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3">
                                <div className="min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{bar.title}</p>
                                    <p className="text-zinc-500 text-xs mt-0.5">
                                        {new Date(bar.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <Link
                                    href={`/capture/explore?barId=${bar.id}`}
                                    className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-500 text-white transition"
                                >
                                    Explore →
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Personal Quests (unplaced) */}
            {personalQuests.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-px bg-zinc-800 flex-1"></div>
                        <h2 className="text-amber-500 uppercase tracking-widest text-sm font-bold">Personal Quests</h2>
                        <div className="h-px bg-zinc-800 flex-1"></div>
                    </div>
                    <p className="text-zinc-500 text-sm">Quests created from your BARs. Place them in a thread or contribute to the campaign gameboard.</p>
                    <div className="space-y-3">
                        {personalQuests.map((quest) => (
                            <div key={quest.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
                                <div>
                                    {quest.moveType && (
                                        <span className="text-xs uppercase tracking-wider text-purple-400">
                                            {quest.moveType.replace(/_/g, ' ')}
                                        </span>
                                    )}
                                    <p className="text-white font-medium mt-0.5">{quest.title}</p>
                                    {quest.description && (
                                        <p className="text-zinc-400 text-sm mt-1 line-clamp-2">{quest.description}</p>
                                    )}
                                </div>
                                <HandQuestActions questId={quest.id} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Private Drafts */}
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
                        view="available"
                    />
                )}
            </section>

            <FaceMovesSection />

            {acceptedInvites.length > 0 && (
                <section className="space-y-6">
                    <div className="flex gap-3 items-center">
                        <div className="h-px bg-zinc-800 flex-1"></div>
                        <h2 className="text-emerald-500 uppercase tracking-widest text-sm font-bold">Invitations Accepted</h2>
                        <div className="h-px bg-zinc-800 flex-1"></div>
                    </div>
                    <div className="space-y-2">
                        {acceptedInvites.flatMap((inv) =>
                            inv.players.map((p) => (
                                <div
                                    key={`${inv.id}-${p.id}`}
                                    className="flex items-center justify-between gap-3 py-2 px-4 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-sm"
                                >
                                    <span className="text-emerald-200">
                                        Your invitation was accepted by <span className="font-medium text-white">{p.name}</span>
                                    </span>
                                    <span className="text-xs text-zinc-500 shrink-0">
                                        {new Date(p.createdAt).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}
        </div>
    )
}
