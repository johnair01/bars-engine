'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const CAMPAIGN_ID = 'bruised-banana'

export interface OnboardingBarPayload {
    title: string
    content: string
    rawSignal: string
    lens: string
    quadrant: string
    campaignId: string
}

/**
 * Create a public BAR from onboarding state.
 * When authenticated: creates immediately.
 * When not authenticated: returns { pending: true, payload } for caller to store in campaignState.
 */
export async function createOnboardingBar(payload: OnboardingBarPayload): Promise<
    | { success: true; barId: string }
    | { pending: true; payload: OnboardingBarPayload }
    | { error: string }
> {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    const title = (payload.title || payload.content?.slice(0, 40) || 'My signal').trim()
    const tags = [payload.lens, payload.quadrant, 'BruisedBanana'].filter(Boolean)
    const completionEffects = JSON.stringify({
        rawSignal: payload.rawSignal,
        source: 'twine_onboarding',
        campaignId: payload.campaignId,
        onboarding: true,
    })

    if (!playerId) {
        return { pending: true, payload }
    }

    try {
        const creator = await db.player.findUnique({
            where: { id: playerId },
            select: { id: true, nationId: true, playbookId: true }
        })
        if (!creator) return { error: 'Player not found' }
        // Allow BAR creation without nation/playbook for onboarding (spec says create immediately when authenticated)
        const effectiveVisibility = 'public' as const

        const newBar = await db.customBar.create({
            data: {
                creatorId: playerId,
                title,
                description: payload.content,
                type: 'vibe',
                reward: 1,
                inputs: JSON.stringify([{ key: 'response', label: 'Response', type: 'text', placeholder: '' }]),
                visibility: effectiveVisibility,
                status: 'active',
                storyPath: 'collective',
                storyContent: payload.rawSignal,
                completionEffects,
                rootId: 'temp',
                allyshipDomain: payload.lens || null,
                gameMasterFace: null,
            }
        })

        await db.customBar.update({
            where: { id: newBar.id },
            data: { rootId: newBar.id }
        })

        revalidatePath('/')
        revalidatePath('/hand')
        revalidatePath('/bars/available')
        return { success: true, barId: newBar.id }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to create BAR'
        console.error('[onboarding-bar]', msg, e)
        return { error: msg }
    }
}

/**
 * Finalize pending BAR after signup. Called from createCampaignPlayer.
 */
export async function finalizePendingBar(
    playerId: string,
    payload: OnboardingBarPayload
): Promise<{ barId: string } | { error: string }> {
    const title = (payload.title || payload.content?.slice(0, 40) || 'My signal').trim()
    const completionEffects = JSON.stringify({
        rawSignal: payload.rawSignal,
        source: 'twine_onboarding',
        campaignId: payload.campaignId,
        onboarding: true,
    })

    try {
        const newBar = await db.customBar.create({
            data: {
                creatorId: playerId,
                title,
                description: payload.content,
                type: 'vibe',
                reward: 1,
                inputs: JSON.stringify([{ key: 'response', label: 'Response', type: 'text', placeholder: '' }]),
                visibility: 'public',
                status: 'active',
                storyPath: 'collective',
                storyContent: payload.rawSignal,
                completionEffects,
                rootId: 'temp',
                allyshipDomain: payload.lens || null,
            }
        })

        await db.customBar.update({
            where: { id: newBar.id },
            data: { rootId: newBar.id }
        })

        return { barId: newBar.id }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to finalize BAR'
        console.error('[onboarding-bar] finalizePendingBar', msg, e)
        return { error: msg }
    }
}
