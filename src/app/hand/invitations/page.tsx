import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { loadVaultCoreData, getVaultBaseUrl } from '@/lib/vault-queries'
import { VaultRoomHeader } from '@/components/hand/VaultRoomHeader'
import { VaultInvitationBarsList } from '@/components/hand/VaultInvitationBarsList'
import Link from 'next/link'

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

            <p className="text-xs text-zinc-500">
                <Link href="/hand/forge-invitation" className="text-emerald-400 hover:text-emerald-300">
                    Forge a new invitation
                </Link>
                {' · '}
                <Link href="/hand/moves" className="text-zinc-400 hover:text-zinc-300">
                    4 Moves reference
                </Link>
            </p>

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
