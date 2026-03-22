import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { loadVaultCoreData } from '@/lib/vault-queries'
import { VaultRoomHeader } from '@/components/hand/VaultRoomHeader'
import { VaultPersonalQuestsBlock } from '@/components/hand/VaultPersonalQuestsBlock'
import { PlacementModal } from '@/components/hand/PlacementModal'
import Link from 'next/link'

export default async function HandQuestsRoomPage(props: { searchParams: Promise<{ quest?: string }> }) {
    const searchParams = await props.searchParams
    const highlightQuestId = searchParams.quest ?? null

    const player = await getCurrentPlayer()
    if (!player) redirect('/conclave/guided')
    if (!isGameAccountReady(player)) redirect('/conclave/guided')

    const data = await loadVaultCoreData(player.id, 'room')

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
            <VaultRoomHeader
                title="Personal Quests"
                description="Unplaced quests from your BARs or 321 — place them in a thread or on the campaign gameboard."
            />

            <p className="text-xs text-zinc-500">
                <Link href="/hand" className="text-zinc-400 hover:text-zinc-300">
                    ← Vault lobby
                </Link>
                {' · '}
                <Link href="/hand/moves" className="text-zinc-400 hover:text-zinc-300">
                    4 Moves reference
                </Link>
            </p>

            {data.unplacedQuestCount === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                    No unplaced personal quests right now. Create from a BAR or 321, then return here.
                </div>
            ) : (
                <>
                    {data.unplacedQuestCount > data.personalQuestsRaw.length ? (
                        <p className="text-xs text-zinc-600">
                            Showing {data.personalQuestsRaw.length} of {data.unplacedQuestCount} unplaced quests (newest
                            first).
                        </p>
                    ) : null}
                    <VaultPersonalQuestsBlock quests={data.personalQuestRows} highlightQuestId={highlightQuestId} />
                </>
            )}

            {highlightQuestId &&
            data.personalQuestsRaw.some((q: { id: string }) => q.id === highlightQuestId) ? (
                <PlacementModal questId={highlightQuestId} />
            ) : null}
        </div>
    )
}
