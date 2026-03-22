/**
 * Shared Prisma loaders for Vault lobby (`/hand`) and room pages (`/hand/charges`, …).
 * @see .specify/specs/vault-page-experience/spec.md
 */
import { db } from '@/lib/db'
import { daysAgoDate, VAULT_ROOM_LIST_CAP, VAULT_SERVER_LIST_CAP, VAULT_STALE_DAYS } from '@/lib/vault-ui'

export const draftWhere = (playerId: string) => ({
    creatorId: playerId,
    visibility: 'private' as const,
    claimedById: null,
    status: 'active' as const,
    archivedAt: null,
    type: { not: 'quest' as const },
    inviteId: null,
})

export const unplacedPersonalQuestWhere = (playerId: string) => ({
    creatorId: playerId,
    type: 'quest' as const,
    OR: [{ sourceBarId: { not: null } }, { source321SessionId: { not: null } }],
    parentId: null,
    status: 'active' as const,
    archivedAt: null,
    threadQuests: { none: {} },
})

/** Private drafts or unplaced personal quests; not system, not merged away (Vault Compost v1). */
export function compostEligibleWhere(playerId: string) {
    return {
        AND: [
            { isSystem: false },
            { mergedIntoId: null },
            {
                OR: [draftWhere(playerId), unplacedPersonalQuestWhere(playerId)],
            },
        ],
    }
}

export async function loadCompostEligibleBars(playerId: string) {
    return db.customBar.findMany({
        where: compostEligibleWhere(playerId),
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            title: true,
            type: true,
            createdAt: true,
        },
    })
}

export type VaultScope = 'lobby' | 'room'

export function vaultListTake(scope: VaultScope): number {
    return scope === 'room' ? VAULT_ROOM_LIST_CAP : VAULT_SERVER_LIST_CAP
}

export function getVaultBaseUrl(): string {
    return typeof process.env.NEXT_PUBLIC_APP_URL === 'string'
        ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
        : ''
}

const chargeSelect = {
    id: true,
    title: true,
    description: true,
    createdAt: true,
    assets: {
        where: { type: 'bar_attachment' as const },
        orderBy: { createdAt: 'asc' as const },
        select: { id: true, url: true, mimeType: true, metadataJson: true },
    },
} as const

const unplacedQuestSelect = {
    id: true,
    title: true,
    description: true,
    moveType: true,
    createdAt: true,
} as const

const invitationSelect = {
    id: true,
    title: true,
    invite: { select: { token: true } },
} as const

async function fetchChargeBarsSelect(playerId: string, take: number) {
    return db.customBar.findMany({
        where: {
            creatorId: playerId,
            type: 'charge_capture',
            status: 'active',
        },
        orderBy: { createdAt: 'desc' },
        take,
        select: chargeSelect,
    })
}

async function fetchUnplacedQuestsSelect(playerId: string, take: number) {
    return db.customBar.findMany({
        where: unplacedPersonalQuestWhere(playerId),
        orderBy: { createdAt: 'desc' },
        take,
        select: unplacedQuestSelect,
    })
}

async function fetchPrivateDraftsFull(playerId: string, take: number) {
    return db.customBar.findMany({
        where: draftWhere(playerId),
        orderBy: { createdAt: 'desc' },
        take,
    })
}

async function fetchInvitationBarsSelect(playerId: string, take: number) {
    return db.customBar.findMany({
        where: {
            creatorId: playerId,
            inviteId: { not: null },
            status: 'active',
        },
        orderBy: { createdAt: 'desc' },
        take,
        select: invitationSelect,
    })
}

/**
 * Counts + bounded lists for Vault lobby and room pages (same filters; different `take`).
 */
export async function loadVaultCoreData(playerId: string, scope: VaultScope) {
    const staleDate = daysAgoDate(VAULT_STALE_DAYS)
    const listTake = vaultListTake(scope)

    const [
        chargeCount,
        draftCount,
        staleDraftCount,
        invitationCount,
        unplacedQuestCount,
        staleUnplacedQuestCount,
        chargeBars,
        personalQuestsRaw,
        privateDrafts,
        invitationBars,
    ] = await Promise.all([
        db.customBar.count({
            where: { creatorId: playerId, type: 'charge_capture', status: 'active' },
        }),
        db.customBar.count({ where: draftWhere(playerId) }),
        db.customBar.count({
            where: { ...draftWhere(playerId), createdAt: { lt: staleDate } },
        }),
        db.customBar.count({
            where: { creatorId: playerId, inviteId: { not: null }, status: 'active' },
        }),
        db.customBar.count({ where: unplacedPersonalQuestWhere(playerId) }),
        db.customBar.count({
            where: {
                ...unplacedPersonalQuestWhere(playerId),
                createdAt: { lt: staleDate },
            },
        }),
        fetchChargeBarsSelect(playerId, listTake),
        fetchUnplacedQuestsSelect(playerId, listTake),
        fetchPrivateDraftsFull(playerId, listTake),
        fetchInvitationBarsSelect(playerId, listTake),
    ])

    const staleItems = staleDraftCount + staleUnplacedQuestCount

    const personalQuestRows = personalQuestsRaw.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        moveType: q.moveType,
    }))

    return {
        chargeCount,
        draftCount,
        staleDraftCount,
        invitationCount,
        unplacedQuestCount,
        staleUnplacedQuestCount,
        staleItems,
        chargeBars,
        personalQuestsRaw,
        privateDrafts,
        invitationBars,
        personalQuestRows,
        listTake,
    }
}

export type VaultCoreData = Awaited<ReturnType<typeof loadVaultCoreData>>

export async function loadAcceptedInvitesForVault(playerId: string) {
    return db.invite.findMany({
        where: { forgerId: playerId, status: 'used' },
        include: { players: { select: { id: true, name: true, createdAt: true } } },
        orderBy: { usedAt: 'desc' },
        take: 20,
    })
}
