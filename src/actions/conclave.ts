'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { z } from 'zod'

import { hashPassword } from '@/lib/auth-utils'
import { assignOrientationThreads } from './quest-thread'

const IdentitySchema = z.object({
    name: z.string().min(2),
    pronouns: z.string().optional(),
    contact: z.string().min(3),
    password: z.string().min(6), // Add password validation
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
        const parsed = JSON.parse(result.data.identity)
        identity = IdentitySchema.parse(parsed)
    } catch (e: any) {
        return { error: `Invalid Identity Data: ${e?.message}` }
    }

    try {
        const invite = await db.invite.findUnique({ where: { token } })
        if (!invite || invite.status !== 'active') {
            return { error: 'Invalid Invite' }
        }

        // Check if account taken
        const existingAccount = await db.account.findUnique({
            where: { email: identity.contact }
        })

        if (existingAccount) {
            // Edge case: Account exists, but maybe they want to add a character?
            // For now, assume this flow is for NEW users.
            return { error: 'Account already exists. Please log in.' }
        }

        const passwordHash = await hashPassword(identity.password)

        const player = await db.$transaction(async (tx) => {
            // 1. Mark invite used
            await tx.invite.update({
                where: { id: invite.id },
                data: { status: 'used', usedAt: new Date() },
            })

            // 2. Create Account
            const account = await tx.account.create({
                data: {
                    email: identity.contact,
                    passwordHash,
                }
            })

            // 3. Create Player (Character)
            const newPlayer = await tx.player.create({
                data: {
                    accountId: account.id,
                    name: identity.name,
                    pronouns: identity.pronouns,
                    contactType: 'email', // TODO: Deprecate
                    contactValue: identity.contact, // TODO: Deprecate
                    // passwordHash, // Removed from Player
                    inviteId: invite.id,
                    nationId,
                    playbookId,
                },
            })

            // 4. Initialize empty Starter Pack
            await tx.starterPack.create({
                data: {
                    playerId: newPlayer.id,
                    data: JSON.stringify({ completedBars: [] }),
                    initialVibeulons: 0,
                }
            })

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

            return newPlayer
        })

        // 6. Assign orientation threads (outside transaction for simplicity)
        await assignOrientationThreads(player.id)

        const cookieStore = await cookies()
        cookieStore.set('bars_player_id', player.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })

    } catch (e: any) {
        console.error("Character creation failed:", e?.message || e)
        return { error: `Failed to create character: ${e?.message || 'Unknown error'}` }
    }

    return { success: true }
}
