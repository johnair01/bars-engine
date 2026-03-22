import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { FaceMovesSection } from '@/components/hand/FaceMovesSection'
import Link from 'next/link'
import { PlacementModal } from '@/components/hand/PlacementModal'
import { SCENE_ATLAS_DISPLAY_NAME, SCENE_ATLAS_TAGLINE } from '@/lib/creator-scene-grid-deck/branding'
import { loadAcceptedInvitesForVault, loadVaultCoreData } from '@/lib/vault-queries'
import { VaultSummaryStrip } from '@/components/hand/VaultSummaryStrip'
import { VaultCollapsibleSection } from '@/components/hand/VaultCollapsibleSection'
import { VaultChargeList } from '@/components/hand/VaultChargeList'
import { VaultPersonalQuestsBlock } from '@/components/hand/VaultPersonalQuestsBlock'
import { VaultPrivateDraftsSection } from '@/components/hand/VaultPrivateDraftsSection'
import { VaultQuickLinks } from '@/components/hand/VaultQuickLinks'
import { VaultInvitationBarsList } from '@/components/hand/VaultInvitationBarsList'
import { VaultNestedRoomsNav } from '@/components/hand/VaultNestedRoomsNav'

export default async function HandPage(props: { searchParams: Promise<{ quest?: string }> }) {
    const searchParams = await props.searchParams
    const highlightQuestId = searchParams.quest ?? null
    const player = await getCurrentPlayer()
    if (!player) redirect('/conclave/guided')
    if (!isGameAccountReady(player)) redirect('/conclave/guided')

    const playerId = player.id

    const [data, acceptedInvites] = await Promise.all([
        loadVaultCoreData(playerId, 'lobby'),
        loadAcceptedInvitesForVault(playerId),
    ])

    const {
        chargeCount,
        draftCount,
        invitationCount,
        unplacedQuestCount,
        staleItems,
        chargeBars,
        personalQuestsRaw,
        privateDrafts,
        invitationBars,
        personalQuestRows,
    } = data

    const baseUrl =
        typeof process.env.NEXT_PUBLIC_APP_URL === 'string'
            ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
            : ''

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-white">Vault</h1>
                <p className="text-zinc-400 mt-1">Review your charges and quests — tend what&apos;s waiting to move.</p>

                <VaultQuickLinks />

                <div className="mt-4">
                    <VaultSummaryStrip
                        counts={{
                            chargeCaptures: chargeCount,
                            unplacedQuests: unplacedQuestCount,
                            privateDrafts: draftCount,
                            staleItems,
                        }}
                    />
                </div>

                <div className="mt-4">
                    <VaultNestedRoomsNav />
                </div>

                {/* Scene Atlas — primary creation affordance */}
                <div className="rounded-xl border border-emerald-900/45 bg-emerald-950/20 p-4 mt-4 space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-emerald-500/90">{SCENE_ATLAS_DISPLAY_NAME}</p>
                    <p className="text-sm text-zinc-400 leading-relaxed">{SCENE_ATLAS_TAGLINE}</p>
                    <Link
                        href="/creator-scene-deck"
                        className="inline-flex text-sm font-medium text-emerald-400 hover:text-emerald-300"
                    >
                        Open {SCENE_ATLAS_DISPLAY_NAME} →
                    </Link>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    <Link
                        href="/capture"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rose-800/50 bg-rose-950/20 text-sm text-rose-400 hover:text-rose-300 hover:border-rose-700/60 transition-colors"
                    >
                        ⚡ Capture Charge
                    </Link>
                    <Link
                        href="/hand/forge-invitation"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-800/50 bg-emerald-950/20 text-sm text-emerald-400 hover:text-emerald-300 hover:border-emerald-700/60 transition-colors"
                    >
                        ✨ Forge Invitation
                    </Link>
                    <Link
                        href="/hand/moves"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        Moves Reference
                    </Link>
                </div>
            </header>

            {/* Charge Captures */}
            {chargeCount > 0 && (
                <VaultCollapsibleSection
                    sectionId="vault-charges"
                    title="Charge Captures"
                    count={chargeCount}
                    titleClassName="text-rose-500"
                    description="Felt charges you captured — turn into quests or explore."
                >
                    <p className="text-xs text-zinc-500">
                        <Link href="/hand/charges" className="text-rose-400 hover:text-rose-300">
                            Open Charges room →
                        </Link>
                    </p>
                    {chargeCount > chargeBars.length ? (
                        <p className="text-xs text-zinc-600">
                            Showing {chargeBars.length} of {chargeCount} captures (newest first).
                        </p>
                    ) : null}
                    <VaultChargeList bars={chargeBars} totalCount={chargeCount} />
                </VaultCollapsibleSection>
            )}

            {/* Personal Quests (unplaced) */}
            {unplacedQuestCount > 0 && (
                <VaultCollapsibleSection
                    sectionId="vault-quests"
                    title="Personal Quests"
                    count={unplacedQuestCount}
                    titleClassName="text-amber-500"
                    description="Quests created from your BARs. Place them in a thread or contribute to the campaign gameboard."
                >
                    <p className="text-xs text-zinc-500">
                        <Link href="/hand/quests" className="text-amber-400 hover:text-amber-300">
                            Open Quests room →
                        </Link>
                    </p>
                    {unplacedQuestCount > personalQuestsRaw.length ? (
                        <p className="text-xs text-zinc-600">
                            Showing {personalQuestsRaw.length} of {unplacedQuestCount} unplaced quests on the lobby
                            (newest first). Open the room for a longer list.
                        </p>
                    ) : null}
                    <VaultPersonalQuestsBlock quests={personalQuestRows} highlightQuestId={highlightQuestId} />
                </VaultCollapsibleSection>
            )}

            {/* Private Drafts */}
            <section className="space-y-6">
                {draftCount === 0 ? (
                    <>
                        <div className="flex items-center gap-3">
                            <div className="h-px bg-zinc-800 flex-1"></div>
                            <h2 className="text-purple-500 uppercase tracking-widest text-sm font-bold">
                                Private Drafts (0)
                            </h2>
                            <div className="h-px bg-zinc-800 flex-1"></div>
                        </div>
                        <p className="text-zinc-500 text-sm text-center max-w-md mx-auto">
                            Private BARs you haven&apos;t published — start one when you&apos;re ready.
                        </p>
                        <p className="text-xs text-center text-zinc-500">
                            <Link href="/hand/drafts" className="text-purple-400 hover:text-purple-300">
                                Open Drafts room →
                            </Link>
                        </p>
                        <VaultPrivateDraftsSection customBars={[]} />
                    </>
                ) : (
                    <VaultCollapsibleSection
                        sectionId="vault-drafts"
                        title="Private Drafts"
                        count={draftCount}
                        titleClassName="text-purple-500"
                        description="Work-in-progress BARs — pick up, edit, or release when you&apos;re ready."
                    >
                        <p className="text-xs text-zinc-500">
                            <Link href="/hand/drafts" className="text-purple-400 hover:text-purple-300">
                                Open Drafts room →
                            </Link>
                        </p>
                        {draftCount > privateDrafts.length ? (
                            <p className="text-xs text-zinc-600">
                                Showing {privateDrafts.length} of {draftCount} drafts on the lobby (newest first).
                            </p>
                        ) : null}
                        <VaultPrivateDraftsSection customBars={privateDrafts} />
                    </VaultCollapsibleSection>
                )}
            </section>

            <FaceMovesSection />

            {/* Invitations I've forged (pending) */}
            {invitationCount > 0 && (
                <VaultCollapsibleSection
                    sectionId="vault-invites"
                    title="Invitations I've forged"
                    count={invitationCount}
                    titleClassName="text-emerald-500"
                >
                    <p className="text-xs text-zinc-500">
                        <Link href="/hand/invitations" className="text-emerald-400 hover:text-emerald-300">
                            Open Invitations room →
                        </Link>
                    </p>
                    {invitationCount > invitationBars.length ? (
                        <p className="text-xs text-zinc-600">
                            Showing {invitationBars.length} of {invitationCount} invitation BARs (newest first).
                        </p>
                    ) : null}
                    <VaultInvitationBarsList
                        bars={invitationBars}
                        totalCount={invitationCount}
                        baseUrl={baseUrl}
                    />
                </VaultCollapsibleSection>
            )}

            {acceptedInvites.length > 0 && (
                <section className="space-y-6">
                    <div className="flex gap-3 items-center">
                        <div className="h-px bg-zinc-800 flex-1"></div>
                        <h2 className="text-emerald-500 uppercase tracking-widest text-sm font-bold">
                            Invitations Accepted
                        </h2>
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
                                        Your invitation was accepted by{' '}
                                        <span className="font-medium text-white">{p.name}</span>
                                    </span>
                                    <span className="text-xs text-zinc-500 shrink-0">
                                        {new Date(p.createdAt).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}
            {highlightQuestId &&
                personalQuestsRaw.some((q: { id: string }) => q.id === highlightQuestId) && (
                <PlacementModal questId={highlightQuestId} />
            )}
        </div>
    )
}
