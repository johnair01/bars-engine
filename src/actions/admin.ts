'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'
import { mintVibulon } from '@/actions/economy'

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
    allowedPlaybooks?: string[]
}) {
    await checkAdmin()

    const payload = {
        title: data.title,
        description: data.description,
        threadType: data.threadType,
        completionReward: data.completionReward || 0,
        allowedPlaybooks: data.allowedPlaybooks ? JSON.stringify(data.allowedPlaybooks) : null,
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
    allowedPlaybooks?: string[]
}) {
    await checkAdmin()

    const payload = {
        title: data.title,
        description: data.description,
        allowedPlaybooks: data.allowedPlaybooks ? JSON.stringify(data.allowedPlaybooks) : null,
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
    return db.customBar.findUnique({ where: { id } })
}

export async function upsertQuest(data: {
    id?: string
    title: string
    description?: string
    reward?: number
    type: string
    inputs: string // JSON string
}) {
    await checkAdmin()

    // Validate inputs JSON
    try {
        if (data.inputs) JSON.parse(data.inputs)
    } catch (e) {
        throw new Error('Invalid JSON for inputs')
    }

    const payload = {
        title: data.title,
        description: data.description || '',
        reward: data.reward || 0,
        type: data.type || 'standard',
        inputs: data.inputs || '[]',
        visibility: 'public', // Default to public for system quests
    }

    let questId = data.id
    if (data.id) {
        await db.customBar.update({
            where: { id: data.id },
            data: payload
        })
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

export async function updatePlayerProfile(playerId: string, data: { nationId?: string, playbookId?: string }) {
    await checkAdmin()

    await db.player.update({
        where: { id: playerId },
        data: {
            nationId: data.nationId || undefined,
            playbookId: data.playbookId || undefined
        }
    })

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
    const admin = await checkAdmin()
    if (admin.id === playerId) throw new Error('Cannot delete your own account')

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
}

// ===================================
// WORLD DATA MANAGEMENT
// ===================================

export async function getAdminWorldData() {
    await checkAdmin()
    return Promise.all([
        db.nation.findMany({ orderBy: { name: 'asc' } }),
        db.playbook.findMany({ orderBy: { name: 'asc' } })
    ])
}

export async function getAdminNation(id: string) {
    await checkAdmin()
    return db.nation.findUnique({ where: { id } })
}

export async function updateNation(id: string, data: any) {
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
    return db.playbook.findUnique({ where: { id } })
}

export async function updateArchetype(id: string, data: any) {
    await checkAdmin()
    await db.playbook.update({
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

