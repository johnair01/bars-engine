import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { loadCompostEligibleBars } from '@/lib/vault-queries'
import { VaultRoomHeader } from '@/components/hand/VaultRoomHeader'
import { VaultCompostClient } from '@/components/hand/VaultCompostClient'

/**
 * @page /hand/compost
 * @entity BAR
 * @description Vault compost room for metabolizing BARs no longer needed - salvage lines that matter, release the rest with care
 * @permissions authenticated
 * @relationships BAR (compost-eligible), PLAYER (vault data)
 * @dimensions WHO:player, WHAT:compost room, WHERE:vault, ENERGY:compost, PERSONAL_THROUGHPUT:compost_count
 * @example /hand/compost
 * @agentDiscoverable false
 */

export default async function HandCompostRoomPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/conclave/guided')
    if (!isGameAccountReady(player)) redirect('/conclave/guided')

    const rows = await loadCompostEligibleBars(player.id)
    const items = rows.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        createdAt: r.createdAt.toISOString(),
    }))

    return (
        <div className="min-h-screen text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
            <VaultRoomHeader
                title="Vault Compost"
                description="Metabolize what you no longer need. Salvage the lines that still matter, then release the rest — care, not shame."
            />

            <p className="text-xs text-zinc-500">
                <Link href="/hand/moves" className="text-zinc-400 hover:text-zinc-300">
                    4 Moves reference
                </Link>
                {' · '}
                <Link href="/hand/drafts" className="text-purple-400 hover:text-purple-300">
                    Drafts room
                </Link>
                {' · '}
                <Link href="/hand/quests" className="text-amber-400/90 hover:text-amber-300">
                    Quests room
                </Link>
            </p>

            <VaultCompostClient items={items} />
        </div>
    )
}
