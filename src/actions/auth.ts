'use server'

import { db } from '@/lib/db'
import { PlayerSignupSchema } from '@/lib/schemas'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { cookies } from 'next/headers'

export async function joinWithInvite(prevState: any, formData: FormData) {
    const rawData = {
        inviteToken: formData.get('inviteToken'),
        name: formData.get('name'),
        contactType: formData.get('contactType'),
        contactValue: formData.get('contactValue'),
    }

    // Validate
    const result = PlayerSignupSchema.safeParse(rawData)
    if (!result.success) {
        return { error: 'Invalid input data.' }
    }

    const { inviteToken, name, contactType, contactValue } = result.data

    // Transaction: Verify invite -> Create Player -> Mark invite used -> Assign pre-role
    try {
        const invite = await db.invite.findUnique({
            where: { token: inviteToken },
        })

        if (!invite || invite.status !== 'active') {
            return { error: 'Invalid or expired invite.' }
        }

        // Check Max Uses
        if (invite.uses >= invite.maxUses) {
            return { error: 'This invite has reached its maximum usage.' }
        }

        const player = await db.$transaction(async (tx) => {
            // 1. Increment Uses
            const newUses = invite.uses + 1
            const shouldClose = newUses >= invite.maxUses

            await tx.invite.update({
                where: { id: invite.id },
                data: {
                    uses: newUses,
                    status: shouldClose ? 'used' : 'active',
                    usedAt: shouldClose ? new Date() : null // Only set usedAt when fully used? Or track last usage? 
                    // Let's keep usedAt for final closure, or just rely on 'uses'.
                },
            })

            // 2. Create Player
            const newPlayer = await tx.player.create({
                data: {
                    name,
                    contactType,
                    contactValue,
                    inviteId: invite.id,
                    onboardingMode: 'guided',
                    storyProgress: JSON.stringify({
                        currentNodeId: 'intro_001',
                        completedNodes: [],
                        decisions: [],
                        vibeulonsEarned: 0,
                        startedAt: new Date(),
                        lastActiveAt: new Date()
                    })
                },
            })

            // 3. Assign Role if preassigned
            if (invite.preassignedRoleKey) {
                const role = await tx.role.findUnique({ where: { key: invite.preassignedRoleKey } })
                if (role) {
                    await tx.playerRole.create({
                        data: {
                            playerId: newPlayer.id,
                            roleId: role.id,
                        },
                    })
                }
            }

            return newPlayer
        })

        // 4. Create tutorial quest for new player (optional, maybe specific to guided later)
        // const { createTutorialQuest } = await import('@/actions/onboarding')
        // await createTutorialQuest(player.id)

        const cookieStore = await cookies()
        cookieStore.set('bars_player_id', player.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })

    } catch (e) {
        console.error(e)
        return { error: 'Failed to join. Email/Phone might be taken.' }
    }

    redirect('/conclave/guided')
}
