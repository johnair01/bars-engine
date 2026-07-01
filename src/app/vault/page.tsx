
import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import Link from 'next/link'

import { loadVaultCoreData } from '@/lib/vault-queries'
import { VaultMoveDashboard } from '@/components/hand/VaultMoveDashboard'
import { VaultHandButton } from '@/components/hand/VaultHandButton'

/**
 * @page /vault
 * @entity SYSTEM
 * @description Personal Vault lobby for the individual practitioner: the five move-rooms (Wake · Open · Clean · Grow · Show) plus a compost nudge. Campaign/scene clutter lives behind campaign contexts, not here.
 * @permissions authenticated
 * @searchParams quest:string (quest ID to highlight, optional)
 * @relationships BAR (charges, drafts, BARs), QUEST (player quests)
 * @energyCost 0
 * @dimensions WHO:player, WHAT:vault lobby, WHERE:hand, ENERGY:move_dashboard, PERSONAL_THROUGHPUT:vault_counts
 * @example /vault?quest=quest-123
 * @agentDiscoverable false
 */

export default async function HandPage(props: { searchParams: Promise<{ quest?: string }> }) {
    const searchParams = await props.searchParams
    const highlightQuestId = searchParams.quest ?? null
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')
    if (!isGameAccountReady(player)) redirect('/conclave/guided')

    const playerId = player.id

    const coreResult = await Promise.allSettled([loadVaultCoreData(playerId, 'lobby')]).then((r) => r[0])

    if (coreResult.status === 'rejected') {
        const err = coreResult.reason
        console.error('[hand] loadVaultCoreData failed', err)
        const msg = err instanceof Error ? err.message : String(err)
        return (
            <div className="min-h-screen text-zinc-200 font-sans p-6 sm:p-12 max-w-lg mx-auto space-y-6 flex flex-col justify-center">
                <h1 className="text-2xl font-bold text-white">Vault couldn&apos;t load</h1>
                <p className="text-zinc-400 text-sm leading-relaxed">
                    The server failed while loading vault data (often DB connectivity, a pending migration, or Prisma
                    Accelerate vs direct DB). Check the terminal where <code className="text-zinc-500">next dev</code>{' '}
                    is running for the full stack trace.
                </p>
                {process.env.NODE_ENV === 'development' ? (
                    <pre className="text-xs text-red-300/90 whitespace-pre-wrap break-words bg-zinc-950 border border-zinc-800 rounded-lg p-3 overflow-x-auto">
                        {msg}
                    </pre>
                ) : null}
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/"
                        className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-900/40"
                    >
                        Home
                    </Link>
                    <Link
                        href="/vault"
                        className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800/80"
                    >
                        Retry
                    </Link>
                </div>
            </div>
        )
    }
    const data = coreResult.value

    const {
        chargeCount,
        draftCount,
        whoContactCount,
        unplacedQuestCount,
        staleItems,
        personalQuestsRaw,
    } = data

    // Redirect ?quest=xxx to the quests room where PlacementModal lives natively
    if (highlightQuestId) {
        const questExists = personalQuestsRaw.some((q: { id: string }) => q.id === highlightQuestId)
        if (questExists) {
            redirect(`/vault/quests?quest=${highlightQuestId}`)
        }
    }

    return (
        <div className="min-h-screen text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
            <header className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                        <h1 className="text-3xl font-bold text-white">Vault</h1>
                        <p className="text-zinc-400 mt-1">
                            All of your allyship BARs — metabolize what you&apos;ve been carrying. Enter any move-room
                            in any order.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                        <VaultHandButton />
                        <Link
                            href="/bars/capture"
                            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-purple-800/70 bg-purple-950/30 px-4 py-3 text-sm font-semibold text-purple-100 hover:border-purple-500/70 hover:bg-purple-900/40 min-h-[44px] sm:min-w-[12rem]"
                        >
                            New BAR →
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

                {/* Stale items CTA (G7) */}
                {staleItems > 0 && (
                    <div className="rounded-lg border border-sky-900/40 bg-sky-950/20 px-4 py-3 flex items-center justify-between gap-4">
                        <p className="text-xs text-sky-400">
                            {staleItems} item{staleItems !== 1 ? 's' : ''} idle 30+ days — ready to compost.
                        </p>
                        <Link
                            href="/vault/compost"
                            className="text-xs font-medium text-sky-400 hover:text-sky-300 whitespace-nowrap"
                        >
                            Compost now →
                        </Link>
                    </div>
                )}
            </header>

            {/* Five-move room nav — Wake · Open · Clean · Grow · Show (FR8) */}
            <VaultMoveDashboard
                chargeCount={chargeCount}
                unplacedQuestCount={unplacedQuestCount}
                draftCount={draftCount}
                whoContactCount={whoContactCount}
                staleItems={staleItems}
            />

            <div className="flex flex-wrap gap-2">
                <Link
                    href="/vault/all"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-900/50 bg-purple-950/25 text-sm text-purple-300 hover:text-purple-200 hover:border-purple-700/60 transition-colors"
                >
                    All BARs →
                </Link>
                <Link
                    href="/vault/moves"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    Moves Reference
                </Link>
            </div>
        </div>
    )
}
