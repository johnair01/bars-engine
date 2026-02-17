'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getPlayerId(): Promise<string | null> {
    const cookieStore = await cookies()
    return cookieStore.get('bars_player_id')?.value ?? null
}

/**
 * Resolve a recipient identifier (email OR player name) to a player ID.
 * Returns null if not found.
 */
async function resolveRecipient(identifier: string): Promise<string | null> {
    if (!identifier) return null
    const trimmed = identifier.trim().toLowerCase()

    // Try by email first (via Account)
    const account = await db.account.findUnique({
        where: { email: trimmed },
        include: { players: { select: { id: true }, take: 1 } }
    })
    if (account?.players[0]) return account.players[0].id

    // Try by contactValue (legacy email on Player)
    const byContact = await db.player.findFirst({
        where: { contactValue: { equals: trimmed, mode: 'insensitive' } },
        select: { id: true }
    })
    if (byContact) return byContact.id

    // Try by player name (case-insensitive)
    const byName = await db.player.findFirst({
        where: { name: { equals: identifier.trim(), mode: 'insensitive' } },
        select: { id: true }
    })
    if (byName) return byName.id

    return null
}

// ---------------------------------------------------------------------------
// CREATE BAR
// ---------------------------------------------------------------------------

export async function createPlayerBar(prevState: { error?: string; success?: boolean } | null, formData: FormData) {
    const playerId = await getPlayerId()
    if (!playerId) return { error: 'Not logged in' }

    const title = (formData.get('title') as string || '').trim()
    const content = (formData.get('content') as string || '').trim()
    const tags = (formData.get('tags') as string || '').trim()

    // Validation
    if (!title) return { error: 'Title is required' }
    if (title.length < 2) return { error: 'Title must be at least 2 characters' }
    if (!content) return { error: 'Content is required' }
    if (content.length < 3) return { error: 'Content must be at least 3 characters' }

    try {
        const bar = await db.customBar.create({
            data: {
                creatorId: playerId,
                title,
                description: content,
                type: 'bar',
                reward: 0,
                visibility: 'private',
                status: 'active',
                storyContent: tags || null,
                inputs: '[]',
                rootId: 'temp',
            }
        })

        // Self-reference rootId
        await db.customBar.update({
            where: { id: bar.id },
            data: { rootId: bar.id }
        })

        console.log(`[BAR] Created bar "${title}" (${bar.id}) by player ${playerId}`)

        revalidatePath('/bars')
        revalidatePath('/')
        return { success: true, barId: bar.id }
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        console.error('[BAR] Create failed:', message)
        return { error: 'Failed to create BAR. Please try again.' }
    }
}

// ---------------------------------------------------------------------------
// SEND / SHARE BAR
// ---------------------------------------------------------------------------

export async function sendBar(prevState: { error?: string; success?: boolean } | null, formData: FormData) {
    const playerId = await getPlayerId()
    if (!playerId) return { error: 'Not logged in' }

    const barId = (formData.get('barId') as string || '').trim()
    const recipientIdentifier = (formData.get('recipient') as string || '').trim()
    const note = (formData.get('note') as string || '').trim()

    if (!barId) return { error: 'BAR ID is required' }
    if (!recipientIdentifier) return { error: 'Recipient is required (enter email or username)' }

    // 1. Verify BAR exists and sender owns it
    const bar = await db.customBar.findUnique({ where: { id: barId } })
    if (!bar) return { error: 'BAR not found' }
    if (bar.creatorId !== playerId) return { error: "You don't own this BAR" }
    if (bar.status !== 'active') return { error: 'BAR is not active' }

    // 2. Resolve recipient
    const recipientId = await resolveRecipient(recipientIdentifier)
    if (!recipientId) return { error: `Recipient not found: "${recipientIdentifier}". Try their email or username.` }
    if (recipientId === playerId) return { error: 'Cannot send a BAR to yourself' }

    // 3. Create BarShare record
    try {
        await db.barShare.create({
            data: {
                barId,
                fromUserId: playerId,
                toUserId: recipientId,
                note: note || null,
            }
        })

        const recipient = await db.player.findUnique({ where: { id: recipientId }, select: { name: true } })
        console.log(`[BAR] Shared bar "${bar.title}" (${barId}) from ${playerId} to ${recipient?.name} (${recipientId})`)

        revalidatePath('/bars')
        revalidatePath(`/bars/${barId}`)
        return { success: true }
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        console.error('[BAR] Send failed:', message)
        return { error: 'Failed to send BAR. Please try again.' }
    }
}

// ---------------------------------------------------------------------------
// LIST: My BARs (created by me)
// ---------------------------------------------------------------------------

export async function listMyBars() {
    const playerId = await getPlayerId()
    if (!playerId) return []

    return db.customBar.findMany({
        where: {
            creatorId: playerId,
            type: 'bar',
            status: 'active',
        },
        orderBy: { createdAt: 'desc' },
        include: {
            shares: {
                select: {
                    id: true,
                    toUserId: true,
                    toUser: { select: { name: true } },
                    createdAt: true,
                }
            }
        }
    })
}

// ---------------------------------------------------------------------------
// LIST: Received BARs (shared to me)
// ---------------------------------------------------------------------------

export async function listReceivedBars() {
    const playerId = await getPlayerId()
    if (!playerId) return []

    const shares = await db.barShare.findMany({
        where: { toUserId: playerId },
        orderBy: { createdAt: 'desc' },
        include: {
            bar: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    storyContent: true,
                    createdAt: true,
                }
            },
            fromUser: {
                select: { id: true, name: true }
            }
        }
    })

    return shares
}

// ---------------------------------------------------------------------------
// LIST: Sent BARs (shared by me)
// ---------------------------------------------------------------------------

export async function listSentBars() {
    const playerId = await getPlayerId()
    if (!playerId) return []

    const shares = await db.barShare.findMany({
        where: { fromUserId: playerId },
        orderBy: { createdAt: 'desc' },
        include: {
            bar: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    createdAt: true,
                }
            },
            toUser: {
                select: { id: true, name: true }
            }
        }
    })

    return shares
}

// ---------------------------------------------------------------------------
// GET BAR DETAIL (with access check)
// ---------------------------------------------------------------------------

export async function getBarDetail(barId: string) {
    const playerId = await getPlayerId()
    if (!playerId) return { error: 'Not logged in' }

    const bar = await db.customBar.findUnique({
        where: { id: barId },
        include: {
            creator: { select: { id: true, name: true } },
            shares: {
                include: {
                    toUser: { select: { id: true, name: true } },
                    fromUser: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!bar) return { error: 'BAR not found' }

    // Access check: owner, or has a share addressed to them, or public
    const isOwner = bar.creatorId === playerId
    const isRecipient = bar.shares.some(s => s.toUserId === playerId)
    const isPublic = bar.visibility === 'public'

    if (!isOwner && !isRecipient && !isPublic) {
        return { error: 'Not authorized to view this BAR' }
    }

    return {
        bar,
        isOwner,
        isRecipient,
        playerId,
    }
}

// ---------------------------------------------------------------------------
// GET RECIPIENTS for send form (reuses wallet pattern)
// ---------------------------------------------------------------------------

export async function getBarRecipients() {
    const playerId = await getPlayerId()
    if (!playerId) return []

    return db.player.findMany({
        where: { id: { not: playerId } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    })
}
