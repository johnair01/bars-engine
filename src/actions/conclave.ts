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

        // Check if a player already exists with this contact (legacy data protection)
        const existingPlayer = await db.player.findUnique({
            where: {
                contactType_contactValue: {
                    contactType: 'email',
                    contactValue: identity.contact
                }
            }
        })

        if (existingPlayer) {
            return { error: 'A character already exists with this contact information. Please use a different email or contact support.' }
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

const GuidedIdentitySchema = z.object({
    contact: z.string().email(),
    password: z.string().min(6),
})

function deriveTemporaryNameFromEmail(email: string): string {
    const localPart = email.split('@')[0]?.trim() || ''
    if (localPart.length >= 2) return localPart.slice(0, 50)
    return 'Traveler'
}

export async function createGuidedPlayer(prevState: any, formData: FormData) {
    const rawData = {
        identity: formData.get('identity'),
    }

    let identity
    try {
        const parsed = JSON.parse(rawData.identity as string)
        identity = GuidedIdentitySchema.parse(parsed)
    } catch (e: any) {
        return { error: `Invalid Identity: ${e?.message}` }
    }

    try {
        const existingAccount = await db.account.findUnique({ where: { email: identity.contact } })
        if (existingAccount) return { error: 'Account already exists. Please log in.' }
        const temporaryName = deriveTemporaryNameFromEmail(identity.contact)

        // Use a system open invite or generate one?
        // Guided mode typically implies open access or specific flow.
        // For now, we'll create a single-use invite on the fly if none provided, 
        // OR we just create the account directly if we allow open signup.
        // Let's assume open signup for Guided for now or reuse the token logic if passed.

        // Assuming pure open signup for Guided MVP:
        const passwordHash = await hashPassword(identity.password)

        const player = await db.$transaction(async (tx) => {
            const account = await tx.account.create({
                data: {
                    email: identity.contact,
                    passwordHash,
                }
            })

            // Create a dummy invite for record keeping or use a system code
            const autoInvite = await tx.invite.create({
                data: {
                    token: `guided_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                    status: 'used',
                    usedAt: new Date(),
                    players: {
                        create: {
                            accountId: account.id,
                            name: temporaryName,
                            contactType: 'email',
                            contactValue: identity.contact,
                            onboardingMode: 'guided',
                            // No nation or playbook yet
                        }
                    }
                },
                include: {
                    players: true
                }
            })

            const newPlayer = autoInvite.players[0]

            // Init Starter Pack
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
        const { assignOrientationThreads } = await import('./quest-thread')
        await assignOrientationThreads(player.id)

        const cookieStore = await cookies()
        // Use strict rules for production, lax for dev to ensure it setting
        cookieStore.set('bars_player_id', player.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        })

    } catch (e: any) {
        console.error("Guided creation failed:", e)
        return { error: e.message }
    }

    return { success: true }
}
