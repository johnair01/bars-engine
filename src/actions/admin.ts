'use server'

import fs from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { mintVibulon } from '@/actions/economy'
import { hashPassword } from '@/lib/auth-utils'
import { deriveAvatarConfig } from '@/lib/avatar-utils'

// ===================================
// ADMIN STATS
// ===================================

export async function getAdminStats() {
    const [playerCount, threadCount, packCount, questCount] = await Promise.all([
        db.player.count(),
        db.questThread.count(),
        db.questPack.count(),
        db.customBar.count(),
    ])

    return {
        playerCount,
        threadCount,
        packCount,
        questCount
    }
}

// ===================================
// JOURNEYS (Threads & Packs)
// ===================================

// ===================================
// ADMIN HELPER
// ===================================

async function checkAdmin() {
    const player = await getCurrentPlayer()
    if (!player) throw new Error('Not authenticated')

    const adminRole = await db.playerRole.findFirst({
        where: {
            playerId: player.id,
            role: { key: 'admin' }
        }
    })

    if (!adminRole) throw new Error('Not authorized')
    return player
}

/** Allows admin OR gm role. Use for GM-facing admin pages. */
export async function checkGM() {
    const player = await getCurrentPlayer()
    if (!player) throw new Error('Not authenticated')

    const gmOrAdminRole = await db.playerRole.findFirst({
        where: {
            playerId: player.id,
            role: { key: { in: ['admin', 'gm'] } }
        }
    })

    if (!gmOrAdminRole) throw new Error('Not authorized')
    return player
}

// ===================================
// JOURNEYS (Threads & Packs)
// ===================================

export async function getAdminJourneys() {
    await checkAdmin()

    const [threads, packs] = await Promise.all([
        db.questThread.findMany({ orderBy: { createdAt: 'desc' } }),
        db.questPack.findMany({ orderBy: { createdAt: 'desc' } })
    ])

    return { threads, packs }
}

export async function getAdminThread(id: string) {
    await checkAdmin()
    return db.questThread.findUnique({
        where: { id },
        include: { quests: true }
    })
}

export async function upsertQuestThread(data: {
    id?: string
    title: string
    description?: string
    threadType: string
    completionReward: number
    allowedArchetypes?: string[]
}) {
    await checkAdmin()

    const payload = {
        title: data.title,
        description: data.description,
        threadType: data.threadType,
        completionReward: data.completionReward || 0,
        allowedArchetypes: data.allowedArchetypes ? JSON.stringify(data.allowedArchetypes) : null,
    }

    let threadId = data.id
    if (data.id) {
        await db.questThread.update({
            where: { id: data.id },
            data: payload
        })
    } else {
        const created = await db.questThread.create({
            data: {
                ...payload,
                creatorType: 'admin',
            }
        })
        threadId = created.id
    }
    revalidatePath('/admin/journeys')
    return { id: threadId as string }
}

export async function deleteThread(id: string) {
    await checkAdmin()
    await db.questThread.delete({ where: { id } })
    revalidatePath('/admin/journeys')
}

// ===================================
// PACKS
// ===================================

export async function upsertQuestPack(data: {
    id?: string
    title: string
    description?: string
    allowedArchetypes?: string[]
}) {
    await checkAdmin()

    const payload = {
        title: data.title,
        description: data.description,
        allowedArchetypes: data.allowedArchetypes ? JSON.stringify(data.allowedArchetypes) : null,
    }

    let packId = data.id
    if (data.id) {
        await db.questPack.update({
            where: { id: data.id },
            data: payload
        })
    } else {
        const created = await db.questPack.create({
            data: {
                ...payload,
                creatorType: 'system',
            }
        })
        packId = created.id
    }
    revalidatePath('/admin/journeys')
    return { id: packId as string }
}
// ===================================
// THREAD QUEST MANAGEMENT
// ===================================

export async function getAdminQuests() {
    await checkAdmin()
    return db.customBar.findMany({
        orderBy: { createdAt: 'desc' }
    })
}

export async function updateThreadQuests(threadId: string, questIds: string[]) {
    await checkAdmin()

    // 1. Clear existing quests
    await db.threadQuest.deleteMany({
        where: { threadId }
    })

    // 2. Insert new ordered list
    // Use transaction if possible, or simple loop
    // Prisma createMany doesn't support relation callbacks easily for ordered index?
    // We can do createMany if we map it right

    if (questIds.length > 0) {
        await db.threadQuest.createMany({
            data: questIds.map((questId, index) => ({
                threadId,
                questId,
                position: index + 1
            }))
        })
    }
    revalidatePath(`/admin/journeys/${threadId}`)
}

export async function getAdminPack(id: string) {
    await checkAdmin()
    return db.questPack.findUnique({
        where: { id },
        include: { quests: true }
    })
}

export async function updatePackQuests(packId: string, questIds: string[]) {
    await checkAdmin()

    // 1. Clear existing quests
    await db.packQuest.deleteMany({
        where: { packId }
    })

    // 2. Insert new list
    if (questIds.length > 0) {
        await db.packQuest.createMany({
            data: questIds.map(questId => ({
                packId,
                questId
            }))
        })
    }

    revalidatePath(`/admin/journeys/pack/${packId}`)
}

export async function deletePack(id: string) {
    await checkAdmin()
    await db.questPack.delete({ where: { id } })
    revalidatePath('/admin/journeys')
}
// ===================================
// QUESTS (CustomBars)
// ===================================

export async function getAdminQuest(id: string) {
    await checkAdmin()
    return db.customBar.findUnique({
        where: { id },
        include: {
            upgradedThreads: { select: { adventureId: true } },
            assets: true,
        },
    })
}

export async function upsertQuest(data: {
    id?: string
    title: string
    description?: string
    reward?: number
    type: string
    inputs: string // JSON string
    allowedNations?: string | null
    allowedTrigrams?: string | null
    grantsMoveId?: string | null
}) {
    await checkAdmin()

    // Validate inputs JSON
    try {
        if (data.inputs) JSON.parse(data.inputs)
    } catch {
        throw new Error('Invalid JSON for inputs')
    }

    const payload = {
        title: data.title,
        description: data.description || '',
        reward: data.reward || 0,
        type: data.type || 'standard',
        inputs: data.inputs || '[]',
        visibility: 'public', // Default to public for system quests
        allowedNations: data.allowedNations || null,
        allowedTrigrams: data.allowedTrigrams || null,
        grantsMoveId: data.grantsMoveId || null,
    }

    let questId = data.id
    if (data.id) {
        await db.customBar.update({
            where: { id: data.id },
            data: payload
        })
        if (data.description !== undefined) {
            await db.passage.updateMany({
                where: { linkedQuestId: data.id },
                data: { text: data.description },
            })
        }
    } else {
        const admin = await getCurrentPlayer()
        if (!admin) throw new Error('No user')

        const created = await db.customBar.create({
            data: {
                ...payload,
                creatorId: admin.id,
                // ID is auto-generated if not provided, or we can let user set slug?
                // Let's rely on CUID for now or if ID is passed use it (for manual seeding IDs)
                ...(data.id ? { id: data.id } : {})
            }
        })
        questId = created.id
    }
    revalidatePath('/admin/quests')
    return { id: questId as string }
}

export async function deleteQuest(id: string) {
    await checkAdmin()
    await db.customBar.delete({ where: { id } })
    revalidatePath('/admin/quests')
}

// ===================================
// PLAYER MANAGEMENT
// ===================================

export async function getAdminPlayers() {
    await checkAdmin()
    return db.player.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            roles: {
                include: { role: true }
            },
            _count: {
                select: { vibulons: true }
            }
        }
    })
}

export async function toggleAdminRole(playerId: string, makeAdmin: boolean) {
    const admin = await checkAdmin()

    // Safety: Prevent removing own admin role via UI to avoid lockout
    if (!makeAdmin && playerId === admin.id) {
        throw new Error('Cannot remove your own admin role')
    }

    const adminRole = await db.role.findUnique({ where: { key: 'admin' } })
    if (!adminRole) throw new Error('Admin role not defined in system')

    if (makeAdmin) {
        await db.playerRole.upsert({
            where: {
                playerId_roleId: { playerId, roleId: adminRole.id }
            },
            update: {},
            create: {
                playerId,
                roleId: adminRole.id,
                grantedByAdminId: admin.id
            }
        })
    } else {
        await db.playerRole.deleteMany({
            where: { playerId, roleId: adminRole.id }
        })
    }
    revalidatePath('/admin/players')
}

export async function updatePlayerProfile(playerId: string, data: { nationId?: string, archetypeId?: string }) {
    await checkAdmin()

    const player = await db.player.findUnique({
        where: { id: playerId },
        include: { nation: true, archetype: true }
    })
    if (!player) throw new Error('Player not found')

    // Effective values: use data when provided, else keep existing
    const nationId = data.nationId !== undefined ? (data.nationId || null) : player.nationId
    const archetypeId = data.archetypeId !== undefined ? (data.archetypeId || null) : player.archetypeId

    let avatarConfig: string | null = null
    if (nationId || archetypeId) {
        const nation = nationId ? await db.nation.findUnique({ where: { id: nationId } }) : player.nation
        const archetype = archetypeId ? await db.archetype.findUnique({ where: { id: archetypeId } }) : player.archetype
        avatarConfig = deriveAvatarConfig(nationId, archetypeId, player.campaignDomainPreference, {
            nationName: nation?.name,
            archetypeName: archetype?.name,
            pronouns: player.pronouns
        })
    }
    // When both cleared, explicitly set avatarConfig to null
    const avatarConfigUpdate = nationId || archetypeId ? avatarConfig : null

    await db.player.update({
        where: { id: playerId },
        data: {
            nationId,
            archetypeId,
            avatarConfig: avatarConfigUpdate
        }
    })

    revalidatePath('/admin/players')
    revalidatePath('/admin/avatars')
    return { success: true }
}

export async function assignAvatarToPlayer(
    playerId: string,
    data: { nationId?: string; archetypeId?: string; genderKey?: 'male' | 'female' | 'neutral' | 'default' }
) {
    await checkAdmin()

    const { nationId, archetypeId, genderKey } = data
    if (!nationId && !archetypeId) {
        return { error: 'Select at least one nation or archetype' }
    }

    const player = await db.player.findUnique({
        where: { id: playerId },
        include: { nation: true, archetype: true }
    })
    if (!player) return { error: 'Player not found' }

    const nation = nationId ? await db.nation.findUnique({ where: { id: nationId } }) : player.nation
    const archetype = archetypeId ? await db.archetype.findUnique({ where: { id: archetypeId } }) : player.archetype

    const avatarConfig = deriveAvatarConfig(nationId ?? null, archetypeId ?? null, player.campaignDomainPreference, {
        nationName: nation?.name,
        archetypeName: archetype?.name,
        pronouns: player.pronouns,
        genderKey
    })
    if (!avatarConfig) return { error: 'Could not derive avatar config' }

    await db.player.update({
        where: { id: playerId },
        data: {
            nationId: nationId ?? player.nationId,
            archetypeId: archetypeId ?? player.archetypeId,
            avatarConfig
        }
    })

    revalidatePath('/admin/avatars')
    revalidatePath('/admin/players')
    return { success: true }
}

export async function assignQuestToPlayer(playerId: string, questId: string) {
    await checkAdmin()
    await db.playerQuest.upsert({
        where: { playerId_questId: { playerId, questId } },
        update: { status: 'assigned', completedAt: null, inputs: null },
        create: { playerId, questId, status: 'assigned' }
    })
    revalidatePath('/admin/players')
    return { success: true }
}

/**
 * Admin force-complete: mark a quest as completed on behalf of a stuck player.
 * Grants reward and advances thread progress.
 */
export async function forceCompleteQuest(playerId: string, questId: string) {
    await checkAdmin()

    const assignment = await db.playerQuest.findFirst({
        where: { playerId, questId, status: 'assigned' }
    })
    if (!assignment) return { error: 'Quest not assigned to this player' }

    // Mark complete
    await db.playerQuest.update({
        where: { id: assignment.id },
        data: {
            status: 'completed',
            inputs: JSON.stringify({ adminForceCompleted: true }),
            completedAt: new Date(),
        }
    })

    // Grant reward
    const quest = await db.customBar.findUnique({ where: { id: questId } })
    if (quest && quest.reward > 0) {
        await db.vibulonEvent.create({
            data: {
                playerId,
                source: 'quest',
                amount: quest.reward,
                notes: `Admin force-completed: ${quest.title || questId}`,
            }
        })
    }

    // Advance thread progress if applicable
    const threadQuest = await db.threadQuest.findFirst({
        where: { questId },
        include: { thread: true }
    })
    if (threadQuest) {
        const progress = await db.threadProgress.findFirst({
            where: { playerId, threadId: threadQuest.threadId }
        })
        if (progress && progress.currentPosition === threadQuest.position) {
            await db.threadProgress.update({
                where: { id: progress.id },
                data: { currentPosition: progress.currentPosition + 1 }
            })
        }
    }

    revalidatePath('/admin/players')
    revalidatePath('/')
    return { success: true }
}

export async function assignThreadToPlayer(playerId: string, threadId: string) {
    await checkAdmin()
    await db.threadProgress.upsert({
        where: { threadId_playerId: { threadId, playerId } },
        update: { currentPosition: 1, completedAt: null, isArchived: false },
        create: { threadId, playerId, currentPosition: 1 }
    })
    revalidatePath('/admin/players')
    return { success: true }
}

export async function assignPackToPlayer(playerId: string, packId: string) {
    await checkAdmin()
    await db.packProgress.upsert({
        where: { packId_playerId: { packId, playerId } },
        update: { completed: '[]', completedAt: null, isArchived: false },
        create: { packId, playerId, completed: '[]' }
    })
    revalidatePath('/admin/players')
    return { success: true }
}

export async function deleteAdminPlayer(playerId: string) {
    try {
        const admin = await checkAdmin()
        if (admin.id === playerId) return { error: 'Cannot delete your own account' }

        await db.$transaction(async (tx) => {
            await tx.customBar.updateMany({ where: { creatorId: playerId }, data: { creatorId: admin.id } })
            await tx.customBar.updateMany({ where: { claimedById: playerId }, data: { claimedById: null } })
            await tx.playerRole.deleteMany({ where: { playerId } })
            await tx.playerBar.deleteMany({ where: { playerId } })
            await tx.playerQuest.deleteMany({ where: { playerId } })
            await tx.threadProgress.deleteMany({ where: { playerId } })
            await tx.packProgress.deleteMany({ where: { playerId } })
            await tx.vibulonEvent.deleteMany({ where: { playerId } })
            await tx.vibulon.deleteMany({ where: { ownerId: playerId } })
            await tx.starterPack.deleteMany({ where: { playerId } })
            await tx.player.delete({ where: { id: playerId } })
        })

        revalidatePath('/admin/players')
        return { success: true }
    } catch (error) {
        console.error(`[AdminDeletePlayer] failed for ${playerId}:`, error instanceof Error ? error.message : String(error))
        return { error: 'Failed to delete player. Please refresh and try again.' }
    }
}

// ===================================
// ONBOARDING THREAD MANAGEMENT
// ===================================

/**
 * Get a player's progress on all orientation threads.
 * Returns thread info, current position, total quests, and current quest title.
 */
export async function getPlayerOnboardingProgress(playerId: string) {
    await checkAdmin()

    const progress = await db.threadProgress.findMany({
        where: {
            playerId,
            thread: { threadType: 'orientation' }
        },
        include: {
            thread: {
                include: {
                    quests: {
                        orderBy: { position: 'asc' },
                        include: { quest: { select: { id: true, title: true } } }
                    }
                }
            }
        }
    })

    return progress.map(p => ({
        threadId: p.threadId,
        threadTitle: p.thread.title,
        currentPosition: p.currentPosition,
        totalQuests: p.thread.quests.length,
        isComplete: !!p.completedAt,
        completedAt: p.completedAt,
        startedAt: p.startedAt,
        currentQuest: p.thread.quests.find(q => q.position === p.currentPosition)?.quest || null,
        allQuests: p.thread.quests.map(q => ({
            position: q.position,
            questId: q.quest.id,
            title: q.quest.title,
            isCompleted: q.position < p.currentPosition,
            isCurrent: q.position === p.currentPosition,
        }))
    }))
}

/**
 * Reset a player's thread progress to position 1.
 */
export async function resetPlayerThreadProgress(playerId: string, threadId: string) {
    await checkAdmin()

    await db.threadProgress.update({
        where: { threadId_playerId: { threadId, playerId } },
        data: {
            currentPosition: 1,
            completedAt: null,
            isArchived: false,
        }
    })

    revalidatePath('/admin/players')
    return { success: true }
}

// ===================================
// WORLD DATA MANAGEMENT
// ===================================

export async function getAdminWorldData() {
    await checkAdmin()
    const { CANONICAL_ARCHETYPE_NAMES } = await import('@/lib/canonical-archetypes')
    return Promise.all([
        db.nation.findMany({ where: { archived: false }, orderBy: { name: 'asc' } }),
        db.archetype.findMany({
            where: { name: { in: [...CANONICAL_ARCHETYPE_NAMES] } },
            orderBy: { name: 'asc' },
        }),
    ])
}

// ===================================
// SPRITE ASSET MANAGEMENT
// ===================================

const BASE_KEYS = ['male', 'female', 'neutral', 'default'] as const
const LAYERS = ['base', 'nation_body', 'nation_accent', 'archetype_outfit', 'archetype_accent'] as const

function slugifyName(name: string): string {
    return name
        .toLowerCase()
        .replace(/^the\s+/i, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'unknown'
}

export async function getAdminSpriteAssets() {
    await checkAdmin()

    const [nations, archetypes] = await Promise.all([
        db.nation.findMany({ where: { archived: false }, select: { name: true } }),
        db.archetype.findMany({ select: { name: true } })
    ])

    const nationKeys = nations.map((n) => slugifyName(n.name))
    const archetypeKeys = archetypes.map((p) => slugifyName(p.name))

    const spritesDir = path.join(process.cwd(), 'public', 'sprites', 'parts')
    const byLayer: Record<string, { expected: string[]; existing: string[] }> = {}

    for (const layer of LAYERS) {
        const layerDir = path.join(spritesDir, layer)
        let existing: string[] = []
        if (fs.existsSync(layerDir)) {
            existing = fs
                .readdirSync(layerDir)
                .filter((f) => f.endsWith('.png'))
                .map((f) => f.replace(/\.png$/, ''))
        }

        let expected: string[] = []
        if (layer === 'base') expected = [...BASE_KEYS]
        else if (layer === 'nation_body' || layer === 'nation_accent') expected = nationKeys
        else if (layer === 'archetype_outfit' || layer === 'archetype_accent') expected = archetypeKeys

        byLayer[layer] = { expected: [...new Set(expected)], existing }
    }

    return { byLayer, nations, archetypes }
}

export async function uploadSpriteAsset(formData: FormData) {
    await checkAdmin()

    const layer = formData.get('layer') as string
    const key = formData.get('key') as string
    const file = formData.get('file') as File

    if (!layer || !key || !file) {
        throw new Error('Missing layer, key, or file')
    }
    if (!LAYERS.includes(layer as (typeof LAYERS)[number])) {
        throw new Error('Invalid layer')
    }
    const safeKey = key.replace(/[^a-z0-9-]/g, '').toLowerCase() || 'unknown'
    if (file.type !== 'image/png') {
        throw new Error('Only PNG files are allowed')
    }

    const spritesDir = path.join(process.cwd(), 'public', 'sprites', 'parts')
    const layerDir = path.join(spritesDir, layer)
    if (!fs.existsSync(layerDir)) {
        fs.mkdirSync(layerDir, { recursive: true })
    }

    const destPath = path.join(layerDir, `${safeKey}.png`)
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(destPath, buffer)

    revalidatePath('/admin/avatars/assets')
}

export async function getAdminNation(id: string) {
    await checkAdmin()
    return db.nation.findUnique({ where: { id } })
}

export async function updateNation(id: string, data: { description?: string; imgUrl?: string; wakeUp?: string; cleanUp?: string; growUp?: string; showUp?: string }) {
    await checkAdmin()
    await db.nation.update({
        where: { id },
        data: {
            description: data.description,
            imgUrl: data.imgUrl,
            wakeUp: data.wakeUp,
            cleanUp: data.cleanUp,
            growUp: data.growUp,
            showUp: data.showUp,
        }
    })
    revalidatePath('/admin/world')
    revalidatePath(`/admin/world/nation/${id}`)
}

export async function getAdminArchetype(id: string) {
    await checkAdmin()
    return db.archetype.findUnique({ where: { id } })
}

export async function updateArchetype(id: string, data: { description?: string; content?: string; centralConflict?: string; vibe?: string; energy?: string; primaryQuestion?: string; examples?: string; shadowSignposts?: string; lightSignposts?: string; wakeUp?: string; cleanUp?: string; growUp?: string; showUp?: string; emotionalFirstAid?: string }) {
    await checkAdmin()
    await db.archetype.update({
        where: { id },
        data: {
            description: data.description,
            // Narrative Content (Markdown)
            content: data.content,
            // Rich Data
            centralConflict: data.centralConflict,
            vibe: data.vibe,
            energy: data.energy,
            primaryQuestion: data.primaryQuestion,
            examples: data.examples, // JSON string
            shadowSignposts: data.shadowSignposts, // JSON string
            lightSignposts: data.lightSignposts, // JSON string

            // Flavor Text
            wakeUp: data.wakeUp,
            cleanUp: data.cleanUp,
            growUp: data.growUp,
            showUp: data.showUp,
            emotionalFirstAid: data.emotionalFirstAid,
            // Note: 'name' and 'moves' are intentionally excluded to preserve game mechanics integrity
        }
    })
    revalidatePath('/admin/world')
    revalidatePath(`/admin/world/archetype/${id}`)
}

// ===================================
// ADMIN ECONOMY POWERS
// ===================================

export async function adminMintVibulons(playerId: string, amount: number) {
    await checkAdmin()

    await mintVibulon(playerId, amount, {
        source: 'admin_mint',
        id: 'admin',
        title: 'Admin Infusion'
    })

    revalidatePath('/admin/players')
    return { success: true }
}

export async function adminTransferVibulons(sourcePlayerId: string, targetPlayerId: string, amount: number) {
    await checkAdmin()

    if (sourcePlayerId === targetPlayerId) throw new Error('Cannot transfer to same player')

    return await db.$transaction(async (tx) => {
        // 1. Get Source's Wallet (FIFO)
        const wallet = await tx.vibulon.findMany({
            where: { ownerId: sourcePlayerId },
            orderBy: { createdAt: 'asc' },
            take: amount
        })

        if (wallet.length < amount) {
            throw new Error('Source player has insufficient Vibulons')
        }

        // 2. Transfer Tokens
        for (const token of wallet) {
            await tx.vibulon.update({
                where: { id: token.id },
                data: {
                    ownerId: targetPlayerId,
                    generation: token.generation + 1
                }
            })
        }

        // 3. Log Events
        await tx.vibulonEvent.create({
            data: {
                playerId: sourcePlayerId,
                source: 'admin_transfer',
                amount: -amount,
                notes: `Admin transfer to ${targetPlayerId}`,
                archetypeMove: 'PERMEATE'
            }
        })
        await tx.vibulonEvent.create({
            data: {
                playerId: targetPlayerId,
                source: 'admin_transfer',
                amount: amount,
                notes: `Admin transfer from ${sourcePlayerId}`,
                archetypeMove: 'PERMEATE'
            }
        })

        revalidatePath('/admin/players')
        revalidatePath('/wallet')
        return { success: true }
    })
}

// ===================================
// PLAYER SPAWNER (FOR TESTING)
// ===================================

export async function spawnTestPlayer() {
    await checkAdmin()

    const timestamp = Date.now()
    const email = `test.ritual.${timestamp}@conclave.xyz`
    const rawPassword = `ritual_${timestamp}`
    const passwordHash = await hashPassword(rawPassword)

    try {
        return await db.$transaction(async (tx) => {
            // 1. Create Invite (required by Player model)
            const invite = await tx.invite.create({
                data: {
                    token: `ritual_test_${timestamp}`,
                    maxUses: 1,
                    status: 'active'
                }
            })

            // 2. Create Account
            const account = await tx.account.create({
                data: {
                    email,
                    passwordHash
                }
            })

            // 3. Create Player
            const player = await tx.player.create({
                data: {
                    accountId: account.id,
                    name: `Wayfarer ${timestamp.toString().slice(-4)}`,
                    contactType: 'email',
                    contactValue: email,
                    inviteId: invite.id,
                    onboardingMode: 'guided',
                    onboardingComplete: false,
                    hasSeenWelcome: false,
                    storyProgress: JSON.stringify({
                        currentNodeId: 'intro_001',
                        completedNodes: [],
                        decisions: [],
                        vibeulonsEarned: 0,
                        startedAt: new Date(),
                        lastActiveAt: new Date()
                    })
                }
            })

            return {
                success: true,
                credentials: {
                    email,
                    password: rawPassword
                },
                playerId: player.id
            }
        })
    } catch (error) {
        console.error('[spawnTestPlayer] Failed:', error)
        return { success: false, error: 'Failed to spawn test player' }
    }
}

