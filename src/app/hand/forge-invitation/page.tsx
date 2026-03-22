import { redirect } from 'next/navigation'
import { getCurrentPlayer, isGameAccountReady } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { ForgeInvitationForm } from './ForgeInvitationForm'

const GAME_MASTER_FACES = [
    { id: 'shaman', name: 'Shaman (Earth)' },
    { id: 'challenger', name: 'Challenger (Fire)' },
    { id: 'regent', name: 'Regent (Lake)' },
    { id: 'architect', name: 'Architect (Heaven)' },
    { id: 'diplomat', name: 'Diplomat (Wind)' },
    { id: 'sage', name: 'Sage (Mountain)' },
] as const

export default async function ForgeInvitationPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/conclave/guided')
    if (!isGameAccountReady(player)) redirect('/conclave/guided')

    const nations = await db.nation.findMany({
        where: { archived: false },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
    })

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 max-w-2xl mx-auto space-y-8">
            <header className="space-y-2">
                <Link href="/hand" className="text-zinc-500 hover:text-white text-sm">
                    ← Back to Vault
                </Link>
                <h1 className="text-3xl font-bold text-white">Forge an Invitation</h1>
                <p className="text-zinc-400 text-sm">
                    Create an invitation BAR to invite someone into the game. Choose a nation or school to extend your
                    invitation. They will receive a personalized sign-up experience.
                </p>
            </header>

            <ForgeInvitationForm nations={nations} schools={GAME_MASTER_FACES} />
        </div>
    )
}
