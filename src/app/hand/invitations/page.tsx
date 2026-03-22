import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { loadVaultCoreData, getVaultBaseUrl } from '@/lib/vault-queries'
import { VaultRoomHeader } from '@/components/hand/VaultRoomHeader'
import { VaultFourMovesStrip } from '@/components/hand/VaultFourMovesStrip'
import { VaultInvitationBarsList } from '@/components/hand/VaultInvitationBarsList'

export default async function HandInvitationsRoomPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/conclave/guided')
    if (!isGameAccountReady(player)) redirect('/conclave/guided')

    const data = await loadVaultCoreData(player.id, 'room')
    const baseUrl = getVaultBaseUrl()

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
            <VaultRoomHeader
                title="Invitations I've forged"
                description="Invitation BARs — copy the invite or claim URL and share with someone you want in play."
            />

            <VaultFourMovesStrip
                moves={{
                    wakeUp: {
                        label: 'See pending invitations',
                        note: 'All forged invitations below — check claim status.',
                        href: '#invitation-list',
                    },
                    cleanUp: {
                        label: 'Compost old invitations',
                        note: 'Release unclaimed invites you no longer need.',
                        href: '/hand/compost',
                    },
                    growUp: {
                        label: 'Forge a new invitation',
                        note: 'Create a new personalized invitation BAR.',
                        href: '/hand/forge-invitation',
                    },
                    showUp: {
                        label: 'Share an invite link',
                        note: 'Copy the claim URL from an invitation below and send it.',
                        href: '#invitation-list',
                    },
                }}
            />

            <div id="invitation-list" />
            {data.invitationCount === 0 ? (
                <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                    No invitation BARs yet.{' '}
                    <Link href="/hand/forge-invitation" className="text-emerald-400 hover:text-emerald-300">
                        Forge invitation →
                    </Link>
                </div>
            ) : (
                <>
                    {data.invitationCount > data.invitationBars.length ? (
                        <p className="text-xs text-zinc-600">
                            Showing {data.invitationBars.length} of {data.invitationCount} invitation BARs (newest
                            first).
                        </p>
                    ) : null}
                    <VaultInvitationBarsList
                        bars={data.invitationBars}
                        totalCount={data.invitationCount}
                        baseUrl={baseUrl}
                    />
                </>
            )}
        </div>
    )
}
