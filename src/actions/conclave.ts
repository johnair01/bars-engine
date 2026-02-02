'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const StarterPackSchema = z.object({
    blessedObject: z.string().optional(),
    attunement: z.string().optional(),
    intention: z.string().optional(),
    cursedItem: z.string().optional(),
    commissionTitle: z.string().optional(),
    commissionDesc: z.string().optional(),
    signups: z.array(z.string()).default([]),
})

const CreateCharacterSchema = z.object({
    token: z.string(),
    nationId: z.string(),
    playbookId: z.string(),
    name: z.string().min(2),
    pronouns: z.string().optional(),
    attendance: z.string().optional(),
    starterPack: z.string(), // JSON string to parse
    initialVibeulons: z.coerce.number(),
})

export async function createCharacter(prevState: any, formData: FormData) {
    const rawData = {
        token: formData.get('token'),
        nationId: formData.get('nationId'),
        playbookId: formData.get('playbookId'),
        name: formData.get('name'),
        pronouns: formData.get('pronouns'),
        attendance: formData.get('attendance'),
        starterPack: formData.get('starterPack'),
        initialVibeulons: formData.get('initialVibeulons'),
    }

    const result = CreateCharacterSchema.safeParse(rawData)

    if (!result.success) {
        console.error("Validation Error", result.error)
        return { error: 'Invalid Data' }
    }

    const { token, nationId, playbookId, name, pronouns, attendance, starterPack, initialVibeulons } = result.data

    let parsedStarter = {}
    try {
        parsedStarter = JSON.parse(starterPack)
    } catch (e) {
        console.error("JSON Parse Error", e)
        return { error: 'Invalid Starter Pack Data' }
    }

    const starterResult = StarterPackSchema.safeParse(parsedStarter)
    if (!starterResult.success) {
        return { error: 'Invalid Starter Pack content' }
    }
    const starterData = starterResult.data

    try {
        const invite = await db.invite.findUnique({ where: { token } })
        if (!invite || invite.status !== 'active') {
            return { error: 'Invalid Invite' }
        }

        const player = await db.$transaction(async (tx) => {
            // 1. Mark invite used
            await tx.invite.update({
                where: { id: invite.id },
                data: { status: 'used', usedAt: new Date() },
            })

            // 2. Create Player
            const newPlayer = await tx.player.create({
                data: {
                    name,
                    pronouns,
                    attendance,
                    contactType: 'conclave',
                    contactValue: token, // Using token as unique contact for now
                    inviteId: invite.id,
                    nationId,
                    playbookId,
                },
            })

            // 3. Create Starter Pack
            await tx.starterPack.create({
                data: {
                    playerId: newPlayer.id,
                    blessedObject: starterData.blessedObject || null,
                    attunement: starterData.attunement || null,
                    intention: starterData.intention || null,
                    cursedItem: starterData.cursedItem || null,
                    commissionTitle: starterData.commissionTitle || null,
                    commissionDesc: starterData.commissionDesc || null,
                    signups: JSON.stringify(starterData.signups),
                    initialVibeulons: initialVibeulons,
                }
            })

            // 4. Grant Vibulons
            if (initialVibeulons > 0) {
                await tx.vibulonEvent.create({
                    data: {
                        playerId: newPlayer.id,
                        source: 'starter_pack',
                        amount: initialVibeulons,
                        notes: 'Conclave Creation Bonus'
                    }
                })
            }

            // 5. Assign Role if preassigned
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

            // 6. If Commissioned Quest Exists -> Create Public Quest (Optional, skipping logic for now to keep MVP simple, 
            // but we store the commission in StarterPack for Admin review)

            return newPlayer
        })

        const cookieStore = await cookies()
        cookieStore.set('bars_player_id', player.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })

    } catch (e) {
        console.error(e)
        return { error: 'Failed to create character.' }
    }

    redirect('/')
}
