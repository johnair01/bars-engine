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

    // If orientation adventure exists, redirect to it
    const config = await db.appConfig.findUnique({ where: { id: 'singleton' } })
    const orientationId = config?.orientationQuestId

    if (orientationId) {
        const orientationStory = await db.twineStory.findUnique({ where: { id: orientationId } })
        if (orientationStory && orientationStory.isPublished) {
            redirect(`/adventures/${orientationStory.id}/play`)
        }
    } else {
        // Fallback to legacy hardcoded slug if no dynamic config set
        const orientationStory = await db.twineStory.findUnique({ where: { slug: 'the-first-ritual' } })
        if (orientationStory && orientationStory.isPublished) {
            redirect(`/adventures/${orientationStory.id}/play`)
        }
    }

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
