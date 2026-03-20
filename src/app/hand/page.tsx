import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { StarterQuestBoard } from '@/components/StarterQuestBoard'
import { CreateBarForm } from '@/components/CreateBarForm'
import { FaceMovesSection } from '@/components/hand/FaceMovesSection'
import Link from 'next/link'
import { HandQuestActions } from '@/components/hand/HandQuestActions'
import { ChargeBarCard } from '@/components/hand/ChargeBarCard'
import { PlacementModal } from '@/components/hand/PlacementModal'
import { InvitationBarCard } from '@/components/hand/InvitationBarCard'

export default async function HandPage(props: { searchParams: Promise<{ quest?: string }> }) {
    const searchParams = await props.searchParams
    const highlightQuestId = searchParams.quest ?? null
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
        select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            assets: {
                where: { type: 'bar_attachment' },
                orderBy: { createdAt: 'asc' },
                select: { id: true, url: true, mimeType: true, metadataJson: true },
            },
        },
    })

    // Personal quests: created from a BAR (sourceBarId) or 321 (source321SessionId), not yet a subquest (no parentId),
    // not already in a thread — unplaced quests ready to be routed.
    const personalQuestsRaw = await db.customBar.findMany({
        where: {
            creatorId: playerId,
            type: 'quest',
            OR: [{ sourceBarId: { not: null } }, { source321SessionId: { not: null } }],
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
    // Exclude invitation BARs (inviteId set) — those are delivery vehicles for invites, not editable drafts
    const privateDrafts = await db.customBar.findMany({
        where: {
            creatorId: playerId,
            visibility: 'private',
            claimedById: null,
            status: 'active',
            type: { not: 'quest' },
            inviteId: null, // invitation BARs go to Forge Invitation flow, not drafts
        },
        orderBy: { createdAt: 'desc' }
    })

    // Invitation BARs (inviteId set) — delivery vehicles for invites, not drafts
    const invitationBars = await db.customBar.findMany({
        where: {
            creatorId: playerId,
            inviteId: { not: null },
            status: 'active',
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
            id: true,
            title: true,
            invite: { select: { token: true } },
        },
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
                <h1 className="text-3xl font-bold text-white">Vault</h1>
                <p className="text-zinc-400 mt-1">Everything you&apos;ve built.</p>

                {/* Primary objects — what lives here */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <Link href="/hand" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-800/50 bg-amber-950/20 text-sm text-amber-400 hover:text-amber-300 hover:border-amber-700/60 transition-colors">
                        Quests
                    </Link>
                    <Link href="/bars" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-800/50 bg-purple-950/20 text-sm text-purple-400 hover:text-purple-300 hover:border-purple-700/60 transition-colors">
                        BARs
                    </Link>
                    <Link href="/daemons" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-800/50 bg-indigo-950/20 text-sm text-indigo-400 hover:text-indigo-300 hover:border-indigo-700/60 transition-colors">
                        Daemons
                    </Link>
                    <Link href="/wallet" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40 text-sm text-zinc-400 hover:text-zinc-300 hover:border-zinc-600/60 transition-colors">
                        Vibeulons
                    </Link>
                    <Link href="/bars/available" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700/50 bg-zinc-900/40 text-sm text-zinc-400 hover:text-zinc-300 hover:border-zinc-600/60 transition-colors">
                        Browse BARs
                    </Link>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-2">
                    <Link href="/capture" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rose-800/50 bg-rose-950/20 text-sm text-rose-400 hover:text-rose-300 hover:border-rose-700/60 transition-colors">
                        ⚡ Capture Charge
                    </Link>
                    <Link href="/hand/forge-invitation" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-800/50 bg-emerald-950/20 text-sm text-emerald-400 hover:text-emerald-300 hover:border-emerald-700/60 transition-colors">
                        ✨ Forge Invitation
                    </Link>
                    <Link href="/hand/moves" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                        Moves Reference
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
                            <ChargeBarCard key={bar.id} bar={bar} />
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
                            <div
                                key={quest.id}
                                id={quest.id === highlightQuestId ? 'quest-highlight' : undefined}
                                className={`rounded-xl border p-4 space-y-3 transition-colors ${
                                    quest.id === highlightQuestId
                                        ? 'border-amber-500/60 bg-amber-950/20 ring-1 ring-amber-500/30'
                                        : 'border-zinc-800 bg-zinc-950/50'
                                }`}
                            >
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
                                <HandQuestActions questId={quest.id} showPlacement={true} />
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

            {/* Invitations I've forged (pending) */}
            {invitationBars.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-px bg-zinc-800 flex-1"></div>
                        <h2 className="text-emerald-500 uppercase tracking-widest text-sm font-bold">Invitations I&apos;ve forged</h2>
                        <div className="h-px bg-zinc-800 flex-1"></div>
                    </div>
                    <p className="text-zinc-500 text-sm">Share these with invitees. Copy the invite or claim URL.</p>
                    <div className="space-y-3">
                        {invitationBars.map((bar) => (
                            <InvitationBarCard
                                key={bar.id}
                                barId={bar.id}
                                title={bar.title}
                                token={bar.invite?.token ?? ''}
                                baseUrl={typeof process.env.NEXT_PUBLIC_APP_URL === 'string' ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '') : ''}
                            />
                        ))}
                    </div>
                </section>
            )}

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
            {highlightQuestId && personalQuests.some((q) => q.id === highlightQuestId) && (
                <PlacementModal questId={highlightQuestId} />
            )}
        </div>
    )
}
