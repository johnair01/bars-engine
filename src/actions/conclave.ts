'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const IdentitySchema = z.object({
    name: z.string().min(2),
    pronouns: z.string().optional(),
    contact: z.string().min(3),
})

const CreateCharacterSchema = z.object({
    token: z.string(),
    identity: z.string(), // JSON
    nationId: z.string().min(1),
    playbookId: z.string().min(1),
})

export async function createCharacter(prevState: any, formData: FormData) {
    const rawData = {
        token: formData.get('token'),
        identity: formData.get('identity'),
        nationId: formData.get('nationId'),
        playbookId: formData.get('playbookId'),
    }

    const result = CreateCharacterSchema.safeParse(rawData)
    if (!result.success) {
        console.error("Validation Error", result.error)
        return { error: 'Invalid Data' }
    }

    const { token, nationId, playbookId } = result.data

    // Parse Identity
    let identity
    try {
        console.log("Raw identity string:", result.data.identity)
        const parsed = JSON.parse(result.data.identity)
        console.log("Parsed identity:", parsed)
        identity = IdentitySchema.parse(parsed)
    } catch (e: any) {
        console.error("Identity parsing error:", e?.message)
        return { error: `Invalid Identity Data: ${e?.message}` }
    }

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
                    name: identity.name,
                    pronouns: identity.pronouns,
                    contactType: identity.contact.includes('@') ? 'email' : 'phone',
                    contactValue: identity.contact,
                    inviteId: invite.id,
                    nationId,
                    playbookId,
                },
            })

            // 3. Initialize empty Starter Pack
            await tx.starterPack.create({
                data: {
                    playerId: newPlayer.id,
                    data: JSON.stringify({ completedBars: [] }),
                    initialVibeulons: 0,
                }
            })

            // 4. Assign Role if preassigned
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

        const cookieStore = await cookies()
        cookieStore.set('bars_player_id', player.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })

    } catch (e: any) {
        console.error("Character creation failed:", e?.message || e)
        console.error("Stack:", e?.stack)
        return { error: `Failed to create character: ${e?.message || 'Unknown error'}` }
    }

    return { success: true }
}
