import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { loadVaultCoreData } from '@/lib/vault-queries'
import { VaultRoomHeader } from '@/components/hand/VaultRoomHeader'
import { VaultFourMovesStrip } from '@/components/hand/VaultFourMovesStrip'
import { VaultPrivateDraftsSection } from '@/components/hand/VaultPrivateDraftsSection'

export default async function HandDraftsRoomPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/conclave/guided')
    if (!isGameAccountReady(player)) redirect('/conclave/guided')

    const data = await loadVaultCoreData(player.id, 'room')

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
            <VaultRoomHeader
                title="Private Drafts"
                description="Work-in-progress BARs — pick up, edit, release to the bowl, or publish when ready."
            />

            <VaultFourMovesStrip
                moves={{
                    wakeUp: {
                        label: 'Survey drafts by age',
                        note: 'See all drafts below — oldest ones may be candidates to compost.',
                        href: '#draft-list',
                    },
                    cleanUp: {
                        label: 'Compost stale drafts',
                        note: 'Salvage useful parts and release what you no longer need.',
                        href: '/hand/compost',
                    },
                    growUp: {
                        label: 'Browse all BARs',
                        note: 'Edit, attach media, or refine a draft in the BAR list.',
                        href: '/bars',
                    },
                    showUp: {
                        label: 'Publish to the Salad Bowl',
                        note: 'Pick a draft below — open it to release to the community.',
                        href: '#draft-list',
                    },
                }}
            />

            <div id="draft-list" />
            {data.draftCount > data.privateDrafts.length ? (
                <p className="text-xs text-zinc-600">
                    Showing {data.privateDrafts.length} of {data.draftCount} drafts (newest first).
                </p>
            ) : null}

            <VaultPrivateDraftsSection customBars={data.privateDrafts} />
        </div>
    )
}
