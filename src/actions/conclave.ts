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

const CompletedBarSchema = z.object({
    id: z.string(),
    inputs: z.record(z.any()),
})

const CreateCharacterSchema = z.object({
    token: z.string(),
    identity: z.string(), // JSON
    completedBars: z.string(), // JSON
    vibeulons: z.coerce.number(),
})

export async function createCharacter(prevState: any, formData: FormData) {
    const rawData = {
        token: formData.get('token'),
        identity: formData.get('identity'),
        completedBars: formData.get('completedBars'),
        vibeulons: formData.get('vibeulons'),
    }

    const result = CreateCharacterSchema.safeParse(rawData)
    if (!result.success) {
        console.error("Validation Error", result.error)
        return { error: 'Invalid Data' }
    }

    const { token, vibeulons } = result.data

    // Parse Identity
    let identity
    try {
        identity = IdentitySchema.parse(JSON.parse(result.data.identity))
    } catch (e) {
        return { error: 'Invalid Identity Data' }
    }

    // Parse Completed Bars
    let completedBars: z.infer<typeof CompletedBarSchema>[]
    try {
        completedBars = z.array(CompletedBarSchema).parse(JSON.parse(result.data.completedBars))
    } catch (e) {
        return { error: 'Invalid Bar Data' }
    }

    // Extract Nation & Playbook from Bars
    const nationBar = completedBars.find(b => b.id === 'bar_nation')
    const playbookBar = completedBars.find(b => b.id === 'bar_playbook')

    if (!nationBar || !playbookBar) {
        return { error: 'Nation and Playbook are required.' }
    }

    const nationId = nationBar.inputs.nationId
    const playbookId = playbookBar.inputs.playbookId

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

            // 3. Create Starter Pack (generic JSON)
            await tx.starterPack.create({
                data: {
                    playerId: newPlayer.id,
                    data: JSON.stringify({ completedBars }),
                    initialVibeulons: vibeulons,
                }
            })

            // 4. Grant Vibulons
            if (vibeulons > 0) {
                await tx.vibulonEvent.create({
                    data: {
                        playerId: newPlayer.id,
                        source: 'starter_pack',
                        amount: vibeulons,
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
