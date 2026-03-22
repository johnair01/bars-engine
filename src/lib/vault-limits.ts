/**
 * Vault inventory caps (Phase B — [.specify/specs/vault-page-experience/spec.md](../../.specify/specs/vault-page-experience/spec.md)).
 * Uses the same predicates as `loadVaultCoreData` / `draftWhere` / `unplacedPersonalQuestWhere`.
 */
import { db } from '@/lib/db'
import { draftWhere, unplacedPersonalQuestWhere } from '@/lib/vault-queries'

const DEFAULT_MAX_PRIVATE_DRAFTS = 100
const DEFAULT_MAX_UNPLACED_QUESTS = 50

/** @internal exported for tests */
export function readVaultCap(raw: string | undefined, fallback: number): number | null {
    if (raw === undefined || raw === '') return fallback
    const n = parseInt(raw, 10)
    if (!Number.isFinite(n)) return fallback
    if (n <= 0) return null
    return n
}

export function getVaultMaxPrivateDrafts(): number | null {
    return readVaultCap(process.env.VAULT_MAX_PRIVATE_DRAFTS, DEFAULT_MAX_PRIVATE_DRAFTS)
}

export function getVaultMaxUnplacedQuests(): number | null {
    return readVaultCap(process.env.VAULT_MAX_UNPLACED_QUESTS, DEFAULT_MAX_UNPLACED_QUESTS)
}

export async function countPrivateDraftBars(playerId: string): Promise<number> {
    return db.customBar.count({ where: draftWhere(playerId) })
}

export async function countUnplacedVaultQuests(playerId: string): Promise<number> {
    return db.customBar.count({ where: unplacedPersonalQuestWhere(playerId) })
}

export const VAULT_CAP_MESSAGES = {
    privateDraftsAtCapacity: (max: number) =>
        `Your Vault is full for private drafts (${max} max). Open Vault → Drafts or use Vault Compost (/hand/compost) to salvage and archive items.`,
    unplacedQuestsAtCapacity: (max: number) =>
        `Your Vault is full for unplaced personal quests (${max} max). Place a quest in a thread or gameboard from the Quests room, or use Vault Compost (/hand/compost) to clear space.`,
} as const

export async function assertCanCreatePrivateDraft(
    playerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
    const max = getVaultMaxPrivateDrafts()
    if (max === null) return { ok: true }
    const count = await countPrivateDraftBars(playerId)
    if (count >= max) {
        return { ok: false, error: VAULT_CAP_MESSAGES.privateDraftsAtCapacity(max) }
    }
    return { ok: true }
}

export async function assertCanCreateUnplacedVaultQuest(
    playerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
    const max = getVaultMaxUnplacedQuests()
    if (max === null) return { ok: true }
    const count = await countUnplacedVaultQuests(playerId)
    if (count >= max) {
        return { ok: false, error: VAULT_CAP_MESSAGES.unplacedQuestsAtCapacity(max) }
    }
    return { ok: true }
}
