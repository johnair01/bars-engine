'use server'

import { randomBytes } from 'crypto'
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

function deriveTitle(content: string): string {
    const firstLine = content.trim().split(/\r?\n/)[0] || ''
    if (firstLine.length <= 80) return firstLine || 'Untitled'
    return firstLine.slice(0, 77) + '...'
}

/**
 * Create a BAR without photos. Used when client uploads photos via Vercel Blob
 * (client-side) to avoid FUNCTION_PAYLOAD_TOO_LARGE. Returns barId for client
 * to pass to /api/assets/upload.
 */
export async function createBarForUpload(data: {
    content?: string
    tags?: string
    socialLinks?: string
    hasPhotos?: boolean
}): Promise<{ barId?: string; error?: string }> {
    const playerId = await getPlayerId()
    if (!playerId) return { error: 'Not logged in' }

    const content = (data.content || '').trim()
    const tags = (data.tags || '').trim()
    const socialLinksRaw = (data.socialLinks || '').trim()
    const hasPhotos = !!data.hasPhotos

    if (content.length < 3 && !hasPhotos) {
        return { error: 'Add some text (at least 3 characters) or a photo' }
    }

    const title = content.length >= 3 ? deriveTitle(content) : 'Photo'
    const description = content.length >= 3 ? content : 'Photo'

    try {
        const bar = await db.customBar.create({
            data: {
                creatorId: playerId,
                title,
                description,
                type: 'bar',
                reward: 0,
                visibility: 'private',
                status: 'active',
                storyContent: tags || null,
                inputs: '[]',
                rootId: 'temp',
            }
        })

        await db.customBar.update({
            where: { id: bar.id },
            data: { rootId: bar.id }
        })

        const { validateSocialUrl, getMaxLinksPerBar } = await import('@/lib/bar-social-links')
        const urls = socialLinksRaw
            .split(/[\n,]+/)
            .map((u) => u.trim())
            .filter((u) => u.length > 0)
            .slice(0, getMaxLinksPerBar())
        for (let i = 0; i < urls.length; i++) {
            const result = validateSocialUrl(urls[i])
            if (result.ok) {
                await db.barSocialLink.create({
                    data: { barId: bar.id, platform: result.platform, url: urls[i], sortOrder: i },
                })
            }
        }

        revalidatePath('/bars')
        revalidatePath('/')
        return { barId: bar.id }
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        console.error('[BAR] Create failed:', message)
        return { error: 'Failed to create BAR. Please try again.' }
    }
}

export async function createPlayerBar(prevState: { error?: string; success?: boolean } | null, formData: FormData) {
    const playerId = await getPlayerId()
    if (!playerId) return { error: 'Not logged in' }

    const content = (formData.get('content') as string || '').trim()
    const tags = (formData.get('tags') as string || '').trim()
    const socialLinksRaw = (formData.get('socialLinks') as string || '').trim()
    const photoFront = formData.get('photoFront') as File | null
    const photoBack = formData.get('photoBack') as File | null

    const hasContent = content.length >= 3
    const hasPhoto = (photoFront && photoFront.size > 0) || (photoBack && photoBack.size > 0)

    if (!hasContent && !hasPhoto) {
        return { error: 'Add some text or a photo' }
    }

    const title = hasContent ? deriveTitle(content) : 'Photo'
    const description = hasContent ? content : 'Photo'

    try {
        const bar = await db.customBar.create({
            data: {
                creatorId: playerId,
                title,
                description,
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

        // Photos must be uploaded via client-side Blob (/api/assets/upload), not through
        // server actions — avoids FUNCTION_PAYLOAD_TOO_LARGE. createBarForUpload + uploadBarAsset.
        if (photoFront?.size || photoBack?.size) {
            console.warn('[BAR] createPlayerBar received photos — use createBarForUpload + client upload instead')
        }

        const { validateSocialUrl, getMaxLinksPerBar } = await import('@/lib/bar-social-links')
        const urls = socialLinksRaw
            .split(/[\n,]+/)
            .map((u) => u.trim())
            .filter((u) => u.length > 0)
            .slice(0, getMaxLinksPerBar())
        for (let i = 0; i < urls.length; i++) {
            const result = validateSocialUrl(urls[i])
            if (result.ok) {
                await db.barSocialLink.create({
                    data: { barId: bar.id, platform: result.platform, url: urls[i], sortOrder: i },
                })
            }
        }

        console.log(`[BAR] Created bar (${bar.id}) by player ${playerId}`)

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
// UPDATE BAR (owner only)
// ---------------------------------------------------------------------------

export async function updateBar(
    barId: string,
    data: { description?: string; storyContent?: string }
): Promise<{ success?: boolean; error?: string }> {
    const playerId = await getPlayerId()
    if (!playerId) return { error: 'Not logged in' }

    const bar = await db.customBar.findUnique({
        where: { id: barId },
        select: { creatorId: true, type: true },
    })
    if (!bar) return { error: 'BAR not found' }
    if (bar.creatorId !== playerId) return { error: 'Only the owner can edit this BAR' }
    if (bar.type !== 'bar') return { error: 'Only BARs can be edited' }

    const updates: { description?: string; title?: string; storyContent?: string | null } = {}
    if (data.description !== undefined) {
        const content = data.description.trim()
        if (content.length < 3) return { error: 'Content must be at least 3 characters' }
        updates.description = content
        updates.title = deriveTitle(content)
    }
    if (data.storyContent !== undefined) {
        const trimmed = data.storyContent.trim()
        updates.storyContent = trimmed || null
    }
    if (Object.keys(updates).length === 0) return { success: true }

    await db.customBar.update({
        where: { id: barId },
        data: updates,
    })
    revalidatePath('/bars')
    revalidatePath(`/bars/${barId}`)
    return { success: true }
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
    if (bar.type !== 'bar') return { error: 'Only BARs can be sent from this page' }
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
// SEND BAR OUTSIDE THE GAME (generates an invite link)
// ---------------------------------------------------------------------------

export type SendBarExternalResult =
    | { success: true; shareUrl: string; inviteUrl: string; token: string }
    | { error: string }

/** Generate a secure share token (url-safe, 32 chars). */
function generateShareToken(): string {
    return randomBytes(24).toString('base64url')
}

export async function sendBarExternal(
    prevState: SendBarExternalResult | null,
    formData: FormData
): Promise<SendBarExternalResult> {
    const playerId = await getPlayerId()
    if (!playerId) return { error: 'Not logged in' }

    const barId = (formData.get('barId') as string || '').trim()
    if (!barId) return { error: 'BAR ID is required' }

    const bar = await db.customBar.findUnique({
        where: { id: barId },
        select: { id: true, type: true, creatorId: true, status: true, title: true, collapsedFromInstanceId: true },
    })
    if (!bar) return { error: 'BAR not found' }
    if (bar.type !== 'bar') return { error: 'Only BARs can be shared outside the game' }
    if (bar.creatorId !== playerId) return { error: "You don't own this BAR" }
    if (bar.status !== 'active') return { error: 'BAR is not active' }

    try {
        const shareToken = generateShareToken()
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 72)

        await db.barShareExternal.create({
            data: {
                barId,
                fromUserId: playerId,
                shareToken,
                status: 'pending',
                instanceId: bar.collapsedFromInstanceId ?? undefined,
                expiresAt,
            },
        })

        const baseUrl =
            typeof process.env.NEXT_PUBLIC_APP_URL === 'string'
                ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
                : typeof process.env.VERCEL_URL === 'string'
                  ? `https://${process.env.VERCEL_URL}`
                  : ''
        const shareUrl = baseUrl ? `${baseUrl}/bar/share/${shareToken}` : `/bar/share/${shareToken}`

        revalidatePath(`/bars/${barId}`)
        return { success: true, shareUrl, inviteUrl: shareUrl, token: shareToken }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error'
        console.error('[BAR] sendBarExternal failed:', message)
        return { error: 'Failed to generate share link. Please try again.' }
    }
}

/** Claim an external BAR share (link share to current player, create BarShare, redirect to BAR). */
export async function claimBarShareExternal(shareToken: string): Promise<{ success: true; barId: string } | { error: string }> {
    const playerId = await getPlayerId()
    if (!playerId) return { error: 'Not logged in' }

    const share = await db.barShareExternal.findUnique({
        where: { shareToken },
        select: { id: true, barId: true, fromUserId: true, status: true, expiresAt: true, claimedById: true },
    })
    if (!share) return { error: 'Share not found' }
    if (share.status !== 'pending') return { error: 'Share no longer available' }
    if (new Date() > share.expiresAt) return { error: 'Share expired' }
    if (share.claimedById) return { error: 'Share already claimed' }
    if (share.fromUserId === playerId) return { error: 'Cannot claim your own share' }

    await db.$transaction([
        db.barShareExternal.update({
            where: { id: share.id },
            data: { status: 'claimed', claimedById: playerId },
        }),
        db.barShare.create({
            data: {
                barId: share.barId,
                fromUserId: share.fromUserId,
                toUserId: playerId,
            },
        }),
    ])
    revalidatePath(`/bar/share/${shareToken}`)
    revalidatePath(`/bars/${share.barId}`)
    return { success: true, barId: share.barId }
}

/** Revoke an external BAR share (sender only). */
export async function revokeBarShareExternal(shareId: string): Promise<{ success: true } | { error: string }> {
    const playerId = await getPlayerId()
    if (!playerId) return { error: 'Not logged in' }

    const share = await db.barShareExternal.findUnique({
        where: { id: shareId },
        select: { fromUserId: true, status: true },
    })
    if (!share) return { error: 'Share not found' }
    if (share.fromUserId !== playerId) return { error: 'Only the sender can revoke' }
    if (share.status !== 'pending') return { error: 'Share already revoked or claimed' }

    await db.barShareExternal.update({
        where: { id: shareId },
        data: { status: 'revoked' },
    })
    return { success: true }
}

/** Server action for useActionState: claim share from formData. */
export async function claimBarShareFromForm(
    _prev: { error?: string; barId?: string } | null,
    formData: FormData
): Promise<{ error?: string; barId?: string } | null> {
    const shareToken = (formData.get('shareToken') as string)?.trim()
    if (!shareToken) return { error: 'Invalid share' }
    const result = await claimBarShareExternal(shareToken)
    if ('success' in result) return { barId: result.barId }
    return { error: result.error }
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
            archivedAt: null,
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
            },
            assets: {
                where: { type: 'bar_attachment' },
                orderBy: { createdAt: 'asc' },
                take: 2,
                select: { id: true, url: true, mimeType: true, metadataJson: true },
            },
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
        where: {
            toUserId: playerId,
            bar: { type: 'bar', archivedAt: null },
        },
        orderBy: { createdAt: 'desc' },
        include: {
            bar: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    storyContent: true,
                    createdAt: true,
                    assets: {
                        where: { type: 'bar_attachment' },
                        orderBy: { createdAt: 'asc' },
                        take: 2,
                        select: { id: true, url: true, mimeType: true, metadataJson: true },
                    },
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
        where: {
            fromUserId: playerId,
            bar: { type: 'bar', archivedAt: null },
        },
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
// COLLAPSE QUEST TO BAR (Share-as-BAR)
// ---------------------------------------------------------------------------

export async function collapseQuestToBar(questId: string): Promise<{ barId?: string; error?: string }> {
    const playerId = await getPlayerId()
    if (!playerId) return { error: 'Not logged in' }

    const quest = await db.customBar.findUnique({
        where: { id: questId },
        include: {
            assets: { where: { type: 'bar_attachment' }, orderBy: { createdAt: 'asc' }, take: 1 },
        },
    })
    if (!quest) return { error: 'Quest not found' }
    if (quest.type === 'bar') return { error: 'Already a BAR' }

    // Access: creator or has completed/assigned
    const isCreator = quest.creatorId === playerId
    const hasAccess = isCreator || (await db.playerQuest.findFirst({ where: { questId, playerId } }))
    if (!hasAccess) return { error: 'Not authorized to share this quest' }

    const bar = await db.customBar.create({
        data: {
            creatorId: playerId,
            title: quest.title,
            description: quest.description,
            type: 'bar',
            reward: 0,
            visibility: 'private',
            status: 'active',
            storyContent: quest.allyshipDomain || null,
            inputs: '[]',
            rootId: questId,
            collapsedFromQuestId: questId,
        },
    })

    // Self-reference rootId
    await db.customBar.update({
        where: { id: bar.id },
        data: { rootId: bar.id },
    })

    revalidatePath('/bars')
    revalidatePath(`/bars/${bar.id}`)
    return { barId: bar.id }
}

// ---------------------------------------------------------------------------
// RECORD BAR SHARE VIEWED (talisman first-view)
// ---------------------------------------------------------------------------

export async function recordBarShareViewed(shareId: string): Promise<{ success: boolean; error?: string }> {
    const playerId = await getPlayerId()
    if (!playerId) return { success: false, error: 'Not logged in' }

    const share = await db.barShare.findUnique({
        where: { id: shareId },
        select: { id: true, barId: true, toUserId: true, viewedAt: true },
    })
    if (!share) return { success: false, error: 'Share not found' }
    if (share.toUserId !== playerId) return { success: false, error: 'Not authorized' }
    if (share.viewedAt) return { success: true } // already viewed

    await db.barShare.update({
        where: { id: shareId },
        data: { viewedAt: new Date() },
    })
    revalidatePath('/bars')
    revalidatePath(`/bars/${share.barId}`)
    return { success: true }
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
            },
            shareExternals: {
                where: { status: 'pending' },
                include: { instance: { select: { name: true, slug: true } } },
                orderBy: { createdAt: 'desc' },
            },
            assets: {
                where: { type: 'bar_attachment' },
                orderBy: { createdAt: 'asc' },
            },
            socialLinks: {
                orderBy: { sortOrder: 'asc' },
            },
            collapsedFromQuest: { select: { id: true, title: true } },
            collapsedFromInstance: { select: { id: true, slug: true, name: true } },
        }
    })

    if (!bar) return { error: 'BAR not found' }
    // Allow type 'bar' for owner/recipient; allow any type when public (Library discovery)
    const isPublic = bar.visibility === 'public'
    if (!isPublic && bar.type !== 'bar') return { error: 'Not a BAR' }

    // Access check: owner, or has a share addressed to them, or public
    const isOwner = bar.creatorId === playerId
    const isRecipient = bar.shares.some(s => s.toUserId === playerId)
    // Share through which current user received this BAR (most recent if multiple)
    const recipientShare = isRecipient
        ? bar.shares.filter(s => s.toUserId === playerId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        : null

    if (!isOwner && !isRecipient && !isPublic) {
        return { error: 'Not authorized to view this BAR' }
    }

    return {
        bar,
        isOwner,
        isRecipient,
        recipientShare,
        playerId,
    }
}

// ---------------------------------------------------------------------------
// GROW QUEST FROM BAR (BUO Phase 3 — BAR as seed)
// ---------------------------------------------------------------------------

export async function growQuestFromBar(barId: string): Promise<{ questId?: string; error?: string }> {
    const playerId = await getPlayerId()
    if (!playerId) return { error: 'Not logged in' }

    const bar = await db.customBar.findUnique({
        where: { id: barId },
        select: { id: true, title: true, description: true, type: true, creatorId: true },
    })
    if (!bar) return { error: 'BAR not found' }

    // Access: owner, recipient (for type bar), or creator (for charge_capture)
    const isOwner = bar.creatorId === playerId
    const isRecipient =
        bar.type === 'bar' &&
        (await db.barShare.findFirst({ where: { barId, toUserId: playerId }, select: { id: true } }))
    if (!isOwner && !isRecipient) return { error: 'Not authorized to grow from this BAR' }

    const creator = await db.player.findUnique({
        where: { id: playerId },
        select: { nationId: true, archetypeId: true },
    })
    if (!creator?.nationId || !creator?.archetypeId) {
        return { error: 'Complete your profile (nation and archetype) before creating quests.' }
    }

    const title = (bar.title || 'Quest from BAR').trim().slice(0, 200)
    const description = (bar.description || '').trim() || title

    try {
        const quest = await db.customBar.create({
            data: {
                creatorId: playerId,
                title,
                description,
                type: 'quest',
                reward: 1,
                visibility: 'private',
                status: 'active',
                moveType: 'showUp',
                allyshipDomain: 'GATHERING_RESOURCES',
                sourceBarId: barId,
                inputs: '[]',
                rootId: 'temp',
            },
        })
        await db.customBar.update({ where: { id: quest.id }, data: { rootId: quest.id } })

        await db.playerQuest.upsert({
            where: { playerId_questId: { playerId, questId: quest.id } },
            update: { status: 'assigned' },
            create: { playerId, questId: quest.id, status: 'assigned', assignedAt: new Date() },
        })

        const { completeOnboardingStep } = await import('@/actions/onboarding')
        const creatorFull = await db.player.findUnique({
            where: { id: playerId },
            select: { hasCreatedFirstQuest: true },
        })
        if (creatorFull && !creatorFull.hasCreatedFirstQuest) {
            await completeOnboardingStep('firstCreate')
        }

        revalidatePath('/')
        revalidatePath('/hand')
        revalidatePath(`/bars/${barId}`)
        return { questId: quest.id }
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to create quest'
        return { error: msg }
    }
}

// ---------------------------------------------------------------------------
// GROW DAEMON FROM BAR (Phase 3 — BAR as seed)
// ---------------------------------------------------------------------------

export async function growDaemonFromBar(barId: string): Promise<{ daemonId?: string; error?: string }> {
    const playerId = await getPlayerId()
    if (!playerId) return { error: 'Not logged in' }

    const bar = await db.customBar.findUnique({
        where: { id: barId },
        select: { id: true, title: true, description: true, type: true, creatorId: true },
    })
    if (!bar) return { error: 'BAR not found' }

    const isOwner = bar.creatorId === playerId
    const isRecipient =
        bar.type === 'bar' &&
        (await db.barShare.findFirst({ where: { barId, toUserId: playerId }, select: { id: true } }))
    if (!isOwner && !isRecipient) return { error: 'Not authorized to grow from this BAR' }

    const firstLine = (bar.description || bar.title || '').trim().split(/\r?\n/)[0] || ''
    const name = firstLine.slice(0, 50) || 'Daemon (from BAR)'

    const { discoverDaemon } = await import('@/actions/daemons')
    const result = await discoverDaemon(playerId, 'bar', {
        name: name.length > 2 ? name : 'Daemon (from BAR)',
        sourceBarId: barId,
    })
    if (result.error) return { error: result.error }
    if (result.daemonId) {
        revalidatePath(`/bars/${barId}`)
        return { daemonId: result.daemonId }
    }
    return { error: 'Failed to create daemon' }
}

// ---------------------------------------------------------------------------
// GROW ARTIFACT FROM BAR (Phase 3 — BAR as seed)
// ---------------------------------------------------------------------------

export async function growArtifactFromBar(barId: string): Promise<{ sceneId?: string; error?: string }> {
    const playerId = await getPlayerId()
    if (!playerId) return { error: 'Not logged in' }

    const bar = await db.customBar.findUnique({
        where: { id: barId },
        select: { id: true, description: true, type: true, creatorId: true },
    })
    if (!bar) return { error: 'BAR not found' }

    const isOwner = bar.creatorId === playerId
    const isRecipient =
        bar.type === 'bar' &&
        (await db.barShare.findFirst({ where: { barId, toUserId: playerId }, select: { id: true } }))
    if (!isOwner && !isRecipient) return { error: 'Not authorized to grow from this BAR' }

    const { generateScene } = await import('@/lib/growth-scene/generator')
    const { getActiveDaemonState } = await import('@/actions/daemons')
    const daemonState = await getActiveDaemonState(playerId).catch(() => null)
    const sceneResult = await generateScene(playerId, {
      daemonChannel: daemonState?.channel ?? undefined,
      daemonAltitude: daemonState?.altitude ?? undefined,
    })
    if ('error' in sceneResult) return { error: sceneResult.error }

    const scene = sceneResult.scene
    if (!scene) return { error: 'Scene generation failed' }

    await db.growthSceneArtifact.create({
        data: {
            sceneId: scene.id,
            type: 'BAR',
            payload: JSON.stringify({ barId }),
        },
    })

    revalidatePath(`/bars/${barId}`)
    return { sceneId: scene.id }
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
