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
        `Your Vault is full for private drafts (${max} max). Open Vault → Drafts or use Vault Compost (/vault/compost) to salvage and archive items.`,
    unplacedQuestsAtCapacity: (max: number) =>
        `Your Vault is full for unplaced personal quests (${max} max). Place a quest in a thread or gameboard from the Quests room, or use Vault Compost (/vault/compost) to clear space.`,
} as const

/**
 * True when an action failed because the Vault is at capacity.
 *
 * These messages are returned as plain strings by nine call sites, so a UI that
 * wants to offer composting inline has no way to tell a capacity failure from
 * any other error. Rather than change every signature, callers can ask.
 *
 * Player signal (2026-04-15, /capture): the capacity message rendered the route
 * as bare text — "use Vault Compost (/vault/compost)" — which is not clickable,
 * and following it would have discarded the charge already typed into the form:
 *   "I should be able to click that link and have the vault open up as a modal
 *    for me to do composting or open the compost function in a modal so I don't
 *    have the leave the screen to clear up charge"
 */
export function isVaultCapacityError(message: string | null | undefined): boolean {
    if (!message) return false
    return message.startsWith('Your Vault is full for')
}

/** The capacity message with the raw route stripped — the UI supplies the affordance. */
export function stripVaultCompostPath(message: string): string {
    return message.replace(/\s*\(\/vault\/compost\)/g, '')
}

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
