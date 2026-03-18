'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { isGameAccountReady } from '@/lib/auth'

const GAME_MASTER_FACES = ['shaman', 'challenger', 'regent', 'architect', 'diplomat', 'sage'] as const

export type ForgeInvitationResult =
    | { success: true; barId: string; token: string; inviteUrl: string; claimUrl: string }
    | { error: string }

export async function forgeInvitationBar(
    prevState: ForgeInvitationResult | null,
    formData: FormData
): Promise<ForgeInvitationResult> {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value
    if (!playerId) return { error: 'Not logged in' }

    const player = await db.player.findUnique({
        where: { id: playerId },
        select: { inviteId: true, onboardingComplete: true, nationId: true },
    })
    if (!player) return { error: 'Player not found' }
    if (!isGameAccountReady(player)) return { error: 'Complete onboarding before forging invitations' }

    const targetType = (formData.get('targetType') as string || '').trim().toLowerCase()
    const targetId = (formData.get('targetId') as string || '').trim()
    const title = (formData.get('title') as string || '').trim() || 'You are invited'
    const description =
        (formData.get('description') as string || '').trim() ||
        'A fellow player has invited you into the game. Accept to begin your journey.'
    const message = (formData.get('message') as string || '').trim() || null

    if (!targetType) return { error: 'Target type is required' }
    if (!['nation', 'school', 'sect'].includes(targetType)) {
        return { error: 'Target type must be nation, school, or sect' }
    }

    // INV-5: "open" = let invitee choose; store null for invitationTargetId
    const isOpenInvitation = targetType === 'nation' && (targetId === 'open' || targetId === '')
    const resolvedTargetId = isOpenInvitation ? null : targetId
    if (!resolvedTargetId && targetType !== 'nation') return { error: 'Target ID is required for school/sect' }

    // Validate targetId when not open
    if (targetType === 'nation' && resolvedTargetId) {
        const nation = await db.nation.findUnique({ where: { id: resolvedTargetId }, select: { id: true } })
        if (!nation) return { error: 'Invalid nation' }
    } else if (targetType === 'school' && resolvedTargetId) {
        if (!GAME_MASTER_FACES.includes(resolvedTargetId as (typeof GAME_MASTER_FACES)[number])) {
            return { error: 'Invalid school (face). Must be one of: ' + GAME_MASTER_FACES.join(', ') }
        }
    }
    // sect: defer validation

    try {
        const token = `invite_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

        const result = await db.$transaction(async (tx) => {
            const invite = await tx.invite.create({
                data: {
                    token,
                    status: 'active',
                    forgerId: playerId,
                    invitationTargetType: targetType,
                    invitationTargetId: resolvedTargetId,
                    invitationMessage: message,
                },
            })

            const bar = await tx.customBar.create({
                data: {
                    creatorId: playerId,
                    title,
                    description,
                    type: 'bar',
                    reward: 0,
                    visibility: 'private',
                    status: 'active',
                    inviteId: invite.id,
                    campaignRef: 'bruised-banana',
                    inputs: '[]',
                    rootId: 'temp',
                },
            })

            await tx.customBar.update({
                where: { id: bar.id },
                data: { rootId: bar.id },
            })

            await tx.invite.update({
                where: { id: invite.id },
                data: { invitationBarId: bar.id },
            })

            return { invite, bar }
        })

        const baseUrl =
            typeof process.env.NEXT_PUBLIC_APP_URL === 'string'
                ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
                : typeof process.env.VERCEL_URL === 'string'
                  ? `https://${process.env.VERCEL_URL}`
                  : ''
        const claimUrl = baseUrl ? `${baseUrl}/invite/claim/${result.bar.id}` : `/invite/claim/${result.bar.id}`
        const inviteUrl = baseUrl ? `${baseUrl}/invite/${token}` : `/invite/${token}`

        revalidatePath('/hand')
        revalidatePath('/hand/forge-invitation')
        revalidatePath('/')

        return {
            success: true,
            barId: result.bar.id,
            token,
            inviteUrl,
            claimUrl,
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        console.error('[ForgeInvitationBar] Failed:', message)
        return { error: `Failed to forge invitation: ${message}` }
    }
}
