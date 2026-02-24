'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { hashPassword } from '@/lib/auth-utils'
import { createRequestId, logActionError } from '@/lib/mvp-observability'
import { isAuthBypassEmailVerificationEnabled } from '@/lib/mvp-flags'

const CampaignIdentitySchema = z.object({
    contact: z.string().email(),
    password: z.string().min(6),
})

function deriveTemporaryNameFromEmail(email: string): string {
    const localPart = email.split('@')[0]?.trim() || ''
    if (localPart.length >= 2) return localPart.slice(0, 50)
    return 'Traveler'
}

export async function createCampaignPlayer(prevState: any, formData: FormData) {
    const requestId = createRequestId()
    const rawData = {
        identity: formData.get('identity'),
        campaignState: formData.get('campaignState')
    }

    let identity
    try {
        const parsed = JSON.parse(rawData.identity as string)
        identity = CampaignIdentitySchema.parse(parsed)
    } catch (e: any) {
        return { error: `Invalid Identity: ${e?.message}` }
    }

    let campaignState = {}
    try {
        if (rawData.campaignState) {
            campaignState = JSON.parse(rawData.campaignState as string)
        }
    } catch (e) {
        console.warn("Failed to parse campaign state", e)
    }

    try {
        if (isAuthBypassEmailVerificationEnabled()) {
            console.info(`[MVP][createCampaignPlayer] req=${requestId} AUTH_BYPASS_EMAIL_VERIFICATION enabled (dev-only)`)
        }

        const existingAccount = await db.account.findUnique({ where: { email: identity.contact } })
        if (existingAccount) return { error: 'Account already exists. Please log in.' }
        const temporaryName = deriveTemporaryNameFromEmail(identity.contact)

        const passwordHash = await hashPassword(identity.password)

        const player = await db.$transaction(async (tx) => {
            const account = await tx.account.create({
                data: {
                    email: identity.contact,
                    passwordHash,
                }
            })

            const autoInvite = await tx.invite.create({
                data: {
                    token: `campaign_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                    status: 'used',
                    usedAt: new Date(),
                    players: {
                        create: {
                            accountId: account.id,
                            name: temporaryName,
                            contactType: 'email',
                            contactValue: identity.contact,
                            onboardingMode: 'guided',
                            // Add campaign state as a note for tracking, or inject into progress
                            // For now we persist it to storyProgress just so it's not lost
                            storyProgress: JSON.stringify({
                                campaignBypass: true,
                                state: campaignState
                            })
                        }
                    }
                },
                include: {
                    players: true
                }
            })

            const newPlayer = autoInvite.players[0]

            await tx.starterPack.create({
                data: {
                    playerId: newPlayer.id,
                    data: JSON.stringify({ completedBars: [] }),
                    initialVibeulons: 0,
                }
            })

            return newPlayer
        })

        // Assign orientation threads
        const { assignOrientationThreads } = await import('@/actions/quest-thread')
        await assignOrientationThreads(player.id)

        // Seed Vibeulons (Give 5 instead of 3 for Campaign heroes as a reward for completing Act 5)
        const seedAmount = parseInt(process.env.MVP_SEED_VIBEULONS || '3', 10) + 2

        const { mintVibulon } = await import('@/actions/economy')
        await mintVibulon(player.id, seedAmount, {
            source: 'campaign_seed',
            id: 'campaign_starter',
            title: 'Wake-Up Campaign Bonus'
        }, { skipRevalidate: true })
        console.log(`[MVP] Seeded ${seedAmount} vibeulons for campaign player ${player.id}`)

        // TODO: In the future, parse specific answers from campaignState to unlock special threads
        // e.g. if campaignState["act1"] === "I will build something new", assign Thread Z.

        const cookieStore = await cookies()
        cookieStore.set('bars_player_id', player.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        })

    } catch (e: any) {
        logActionError(
            { action: 'createCampaignPlayer', requestId, userId: null, extra: { email: identity?.contact } },
            e
        )
        return { error: `Account creation failed (req: ${requestId})` }
    }

    return { success: true }
}
