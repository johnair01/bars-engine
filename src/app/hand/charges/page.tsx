import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { loadVaultCoreData } from '@/lib/vault-queries'
import { VaultRoomHeader } from '@/components/hand/VaultRoomHeader'
import { VaultFourMovesStrip } from '@/components/hand/VaultFourMovesStrip'
import { VaultChargeList } from '@/components/hand/VaultChargeList'

export default async function HandChargesRoomPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/conclave/guided')
    if (!isGameAccountReady(player)) redirect('/conclave/guided')

    const data = await loadVaultCoreData(player.id, 'room')

    return (
        <div className="min-h-screen text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
            <VaultRoomHeader
                title="Charge Captures"
                description="Felt charges you captured — turn into quests, explore, or metabolize. This room shows your full in-vault list (up to the server limit)."
            />

            <VaultFourMovesStrip
                moves={{
                    wakeUp: {
                        label: "See what's charged",
                        note: 'All captures below, sorted newest first.',
                        href: '#charge-list',
                    },
                    cleanUp: {
                        label: '321 Shadow Work',
                        note: 'Metabolize a charge with structured shadow process.',
                        href: '/shadow/321',
                    },
                    growUp: {
                        label: 'Emotional First Aid',
                        note: 'Stuck or flooded? EFA helps unblock before exploring.',
                        href: '/adventures',
                    },
                    showUp: {
                        label: 'Capture a new charge',
                        note: "Record what's alive in you right now.",
                        href: '/capture',
                    },
                }}
            />

            <div id="charge-list" />
            {data.chargeCount === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                    No charge captures yet.{' '}
                    <Link href="/capture" className="text-rose-400 hover:text-rose-300">
                        Capture charge →
                    </Link>
                </div>
            ) : (
                <>
                    {data.chargeCount > data.chargeBars.length ? (
                        <p className="text-xs text-zinc-600">
                            Showing {data.chargeBars.length} of {data.chargeCount} captures (newest first).
                        </p>
                    ) : null}
                    <VaultChargeList bars={data.chargeBars} totalCount={data.chargeCount} />
                </>
            )}
        </div>
    )
}
