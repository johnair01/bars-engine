import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { OnboardingForm } from './OnboardingForm'

export default async function OnboardingPage() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        redirect('/login')
    }

    const player = await db.player.findUnique({
        where: { id: playerId },
        select: { id: true, name: true, nationId: true, playbookId: true }
    })

    if (!player) {
        redirect('/login')
    }

    // If already fully set up, go to dashboard
    if (player.nationId && player.playbookId) {
        redirect('/')
    }

    const nations = await db.nation.findMany({
        select: { id: true, name: true, description: true },
        orderBy: { name: 'asc' }
    })

    const playbooks = await db.playbook.findMany({
        select: { id: true, name: true, description: true },
        orderBy: { name: 'asc' }
    })

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex items-center justify-center">
            <OnboardingForm
                playerId={player.id}
                playerName={player.name}
                currentNationId={player.nationId}
                currentPlaybookId={player.playbookId}
                nations={nations}
                playbooks={playbooks}
            />
        </div>
    )
}
