'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const CAMPAIGN_REFS = ['bruised-banana'] as const
export type CampaignRef = (typeof CAMPAIGN_REFS)[number]

export async function linkQuestToCampaign(
    questId: string,
    campaignRef: string,
    campaignGoal: string,
    allyshipDomain: string | null
) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    const quest = await db.customBar.findUnique({
        where: { id: questId },
        select: { id: true, creatorId: true, status: true }
    })

    if (!quest) {
        return { error: 'Quest not found' }
    }

    if (quest.creatorId !== playerId) {
        return { error: 'You can only link quests you created' }
    }

    if (quest.status !== 'active') {
        return { error: 'Can only link active quests' }
    }

    const ref = campaignRef?.trim() || null
    const goal = campaignGoal?.trim() || null
    const domain = allyshipDomain?.trim() || null

    if (!ref || !goal) {
        return { error: 'Campaign ref and goal are required' }
    }

    await db.customBar.update({
        where: { id: questId },
        data: {
            campaignRef: ref,
            campaignGoal: goal,
            allyshipDomain: domain
        }
    })

    revalidatePath('/')
    revalidatePath('/hand')
    revalidatePath('/bars/available')
    revalidatePath(`/bars/${questId}`)
    return { success: true }
}

export function getCampaignRefs(): CampaignRef[] {
    return [...CAMPAIGN_REFS]
}
