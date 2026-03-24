import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import Link from 'next/link'
import { PlacementModal } from '@/components/hand/PlacementModal'
import { SCENE_ATLAS_DISPLAY_NAME, SCENE_ATLAS_TAGLINE } from '@/lib/creator-scene-grid-deck/branding'
import { loadAcceptedInvitesForVault, loadVaultCoreData } from '@/lib/vault-queries'
import { VaultSummaryStrip } from '@/components/hand/VaultSummaryStrip'
import { VaultMoveDashboard } from '@/components/hand/VaultMoveDashboard'

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
        personalQuestsRaw,
    } = data

    // Redirect ?quest=xxx to the quests room where PlacementModal lives natively
    if (highlightQuestId) {
        const questExists = personalQuestsRaw.some((q: { id: string }) => q.id === highlightQuestId)
        if (questExists) {
            redirect(`/hand/quests?quest=${highlightQuestId}`)
        }
    }

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
            <header className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                        <h1 className="text-3xl font-bold text-white">Vault</h1>
                        <p className="text-zinc-400 mt-1">Your private studio — metabolize what you&apos;ve been carrying.</p>
                    </div>
                    <Link
                        href="/capture"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-rose-700/70 bg-rose-950/40 px-4 py-3 text-sm font-semibold text-rose-100 shadow-[0_0_0_1px_rgba(244,63,94,0.15)] transition-colors hover:border-rose-500/80 hover:bg-rose-900/50 hover:text-white min-h-[44px] sm:min-w-[12rem]"
                    >
                        <span aria-hidden>⚡</span>
                        Capture a BAR
                    </Link>
                </div>

                <VaultSummaryStrip
                    counts={{
                        chargeCaptures: chargeCount,
                        unplacedQuests: unplacedQuestCount,
                        privateDrafts: draftCount,
                        staleItems,
                    }}
                />

                {/* Stale items CTA (G7) */}
                {staleItems > 0 && (
                    <div className="rounded-lg border border-sky-900/40 bg-sky-950/20 px-4 py-3 flex items-center justify-between gap-4">
                        <p className="text-xs text-sky-400">
                            {staleItems} item{staleItems !== 1 ? 's' : ''} idle 30+ days — ready to compost.
                        </p>
                        <Link
                            href="/hand/compost"
                            className="text-xs font-medium text-sky-400 hover:text-sky-300 whitespace-nowrap"
                        >
                            Compost now →
                        </Link>
                    </div>
                )}
            </header>

            {/* Four-move room nav — replaces inline collapsible previews (G6, G8) */}
            <VaultMoveDashboard
                chargeCount={chargeCount}
                unplacedQuestCount={unplacedQuestCount}
                draftCount={draftCount}
                invitationCount={invitationCount}
                staleItems={staleItems}
            />

            {/* Accepted invitations — relational signal at lobby level (G20) */}
            {acceptedInvites.length > 0 && (
                <section className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-emerald-500">Invitations Accepted</p>
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

            {/* Scene Atlas — primary creation affordance */}
            <div className="rounded-xl border border-emerald-900/45 bg-emerald-950/20 p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-emerald-500/90">{SCENE_ATLAS_DISPLAY_NAME}</p>
                <p className="text-sm text-zinc-400 leading-relaxed">{SCENE_ATLAS_TAGLINE}</p>
                <Link href="/creator-scene-deck" className="inline-flex text-sm font-medium text-emerald-400 hover:text-emerald-300">
                    Open {SCENE_ATLAS_DISPLAY_NAME} →
                </Link>
            </div>

            <div className="flex flex-wrap gap-2">
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
        </div>
    )
}
