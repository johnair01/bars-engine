import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { loadVaultCoreData } from '@/lib/vault-queries'
import { VaultRoomHeader } from '@/components/hand/VaultRoomHeader'
import { VaultPrivateDraftsSection } from '@/components/hand/VaultPrivateDraftsSection'
import Link from 'next/link'

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

            <p className="text-xs text-zinc-500">
                <Link href="/bars" className="text-purple-400 hover:text-purple-300">
                    All BARs
                </Link>
                {' · '}
                <Link href="/hand/moves" className="text-zinc-400 hover:text-zinc-300">
                    4 Moves reference
                </Link>
            </p>

            {data.draftCount > data.privateDrafts.length ? (
                <p className="text-xs text-zinc-600">
                    Showing {data.privateDrafts.length} of {data.draftCount} drafts (newest first).
                </p>
            ) : null}

            <VaultPrivateDraftsSection customBars={data.privateDrafts} />
        </div>
    )
}
