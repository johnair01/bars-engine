import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { loadVaultCoreData } from '@/lib/vault-queries'
import { VaultRoomHeader } from '@/components/hand/VaultRoomHeader'
import { VaultChargeList } from '@/components/hand/VaultChargeList'

/**
 * @page /vault/open-up
 * @entity BAR
 * @description Vault Open Up room (Felt sense) — feel into what's alive before acting on it
 * @permissions authenticated
 * @relationships BAR (charges + deck-seeded practice BARs), PLAYER (vault data)
 * @dimensions WHO:player, WHAT:felt-sense room, WHERE:vault, ENERGY:open_up
 * @example /vault/open-up
 * @agentDiscoverable false
 */

export default async function VaultOpenRoomPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')
    if (!isGameAccountReady(player)) redirect('/conclave/guided')

    const data = await loadVaultCoreData(player.id, 'room')

    return (
        <div className="min-h-screen text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
            <VaultRoomHeader
                title="Open Up — Felt sense"
                description="Before you correct, compost, or act, soften toward what's alive. Widen the aperture so the truth can land. Receive what's getting through."
            />

            <div className="rounded-xl border border-cyan-900/45 bg-cyan-950/15 p-4 space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-cyan-500/90">The practice</p>
                <p className="text-sm text-cyan-100/80 leading-relaxed">
                    Pick something below and just feel into it — emotion, body, what it points at. This is a
                    non-destructive move: feeling into a charge never changes its state. Saving felt-sense notes
                    arrives in the next update.
                </p>
            </div>

            <section className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">What&apos;s alive</p>
                {data.chargeCount === 0 ? (
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        Nothing to feel into yet. Capture a charge or send an Allyship Deck card to BARS, then come
                        back and open up to it.
                    </p>
                ) : (
                    <VaultChargeList bars={data.chargeBars} totalCount={data.chargeCount} />
                )}
            </section>
        </div>
    )
}
