
import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import Link from 'next/link'

import { SCENE_ATLAS_DISPLAY_NAME, SCENE_ATLAS_TAGLINE } from '@/lib/creator-scene-grid-deck/branding'
import { loadAcceptedInvitesForVault, loadVaultCoreData } from '@/lib/vault-queries'
import { loadEventInviteBarsForStewards } from '@/lib/vault-event-invite-bars'
import { VaultCampaignInviteBars } from '@/components/hand/VaultCampaignInviteBars'
import { VaultSummaryStrip } from '@/components/hand/VaultSummaryStrip'
import { VaultMoveDashboard } from '@/components/hand/VaultMoveDashboard'

/**
 * @page /hand
 * @entity SYSTEM
 * @description Vault lobby showing player's personal workspace: charges, quests, BARs, compost, invites, and 4-move dashboard
 * @permissions authenticated
 * @searchParams quest:string (quest ID to highlight, optional)
 * @relationships BAR (charges, drafts, BARs), QUEST (player quests), CAMPAIGN (invites), EVENT (invite BARs)
 * @energyCost 0
 * @dimensions WHO:player, WHAT:vault lobby, WHERE:hand, ENERGY:move_dashboard, PERSONAL_THROUGHPUT:vault_counts
 * @example /hand?quest=quest-123
 * @agentDiscoverable false
 */

export default async function HandPage(props: { searchParams: Promise<{ quest?: string }> }) {
    const searchParams = await props.searchParams
    const highlightQuestId = searchParams.quest ?? null
    const player = await getCurrentPlayer()
    if (!player) redirect('/conclave/guided')
    if (!isGameAccountReady(player)) redirect('/conclave/guided')

    const playerId = player.id
    const isAdmin = !!player.roles?.some((r: { role: { key: string } }) => r.role.key === 'admin')

    const [data, acceptedInvites, eventInviteBars] = await Promise.all([
        loadVaultCoreData(playerId, 'lobby'),
        loadAcceptedInvitesForVault(playerId),
        loadEventInviteBarsForStewards(playerId, { includeAllForAdmin: isAdmin }),
    ])

    const {
        chargeCount,
        draftCount,
        whoContactCount,
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
        <div className="min-h-screen text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
            <header className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                        <h1 className="text-3xl font-bold text-white">Vault</h1>
                        <p className="text-zinc-400 mt-1">Your private studio — metabolize what you&apos;ve been carrying.</p>
                        <p className="text-xs text-zinc-600 mt-2">
                            List discoveries publicly in{' '}
                            <Link
                                href="/campaign/marketplace?ref=bruised-banana"
                                className="text-teal-500 hover:text-teal-400 font-medium"
                            >
                                campaign stalls
                            </Link>{' '}
                            (mall) — explore stays in hub &amp; map.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                        <Link
                            href="/bars/create"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-amber-800/70 bg-amber-950/30 px-4 py-3 text-sm font-semibold text-amber-100 hover:border-amber-500/70 hover:bg-amber-900/40 min-h-[44px] sm:min-w-[12rem]"
                        >
                            <span aria-hidden>📜</span>
                            Create BAR
                        </Link>
                        <Link
                            href="/campaign/marketplace?ref=bruised-banana"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-teal-800/70 bg-teal-950/30 px-4 py-3 text-sm font-semibold text-teal-100 hover:border-teal-500/70 hover:bg-teal-900/40 min-h-[44px] sm:min-w-[10rem]"
                        >
                            Stalls
                        </Link>
                        <Link
                            href="/capture"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-rose-800/60 bg-rose-950/25 px-4 py-3 text-sm font-medium text-rose-200/95 transition-colors hover:border-rose-500/75 hover:bg-rose-900/35 min-h-[44px] sm:min-w-[11rem]"
                            title="Name today’s emotional charge — same as NOW throughput"
                        >
                            <span aria-hidden>⚡</span>
                            Capture charge
                        </Link>
                    </div>
                </div>

                <VaultSummaryStrip
                    counts={{
                        chargeCaptures: chargeCount,
                        unplacedQuests: unplacedQuestCount,
                        privateDrafts: draftCount,
                        whoContacts: whoContactCount,
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
                whoContactCount={whoContactCount}
                invitationCount={invitationCount}
                staleItems={staleItems}
            />

            <VaultCampaignInviteBars bars={eventInviteBars} />

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
