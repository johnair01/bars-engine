/**
 * Vault Compost v1 — salvage payload + batch limits.
 * @see .specify/specs/vault-page-experience/spec.md (FR-C3–FR-C5)
 */

export const COMPOST_MAX_SOURCES = 50
export const COMPOST_MAX_SALVAGE_LINES = 100
export const COMPOST_MAX_LINE_CHARS = 500
export const COMPOST_MAX_TAGS = 20
export const COMPOST_MAX_TAG_CHARS = 64
export const COMPOST_MAX_RELEASE_NOTE_CHARS = 2000

/** Persisted on `CompostLedger.salvagePayload` (JSON). */
export type VaultSalvagePayload = {
    salvageLines: string[]
    tags?: string[]
    releaseNote?: string
}

export type VaultSalvagePayloadInput = {
    salvageLinesRaw: string
    tagsRaw?: string
    releaseNoteRaw?: string
}

export function parseSalvagePayload(input: VaultSalvagePayloadInput): { ok: true; payload: VaultSalvagePayload } | { ok: false; error: string } {
    const lines = input.salvageLinesRaw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    if (lines.length === 0) {
        return { ok: false, error: 'Add at least one salvage line — a phrase or beat you want to keep from what you’re releasing.' }
    }
    if (lines.length > COMPOST_MAX_SALVAGE_LINES) {
        return { ok: false, error: `Too many salvage lines (max ${COMPOST_MAX_SALVAGE_LINES}).` }
    }
    for (const line of lines) {
        if (line.length > COMPOST_MAX_LINE_CHARS) {
            return { ok: false, error: `Each salvage line must be at most ${COMPOST_MAX_LINE_CHARS} characters.` }
        }
    }
    let tags: string[] | undefined
    if (input.tagsRaw && input.tagsRaw.trim()) {
        const rawTags = input.tagsRaw
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        if (rawTags.length > COMPOST_MAX_TAGS) {
            return { ok: false, error: `Too many tags (max ${COMPOST_MAX_TAGS}).` }
        }
        for (const t of rawTags) {
            if (t.length > COMPOST_MAX_TAG_CHARS) {
                return { ok: false, error: `Each tag must be at most ${COMPOST_MAX_TAG_CHARS} characters.` }
            }
        }
        tags = rawTags
    }
    let releaseNote: string | undefined
    if (input.releaseNoteRaw && input.releaseNoteRaw.trim()) {
        const rn = input.releaseNoteRaw.trim()
        if (rn.length > COMPOST_MAX_RELEASE_NOTE_CHARS) {
            return { ok: false, error: `Release note must be at most ${COMPOST_MAX_RELEASE_NOTE_CHARS} characters.` }
        }
        releaseNote = rn
    }
    return {
        ok: true,
        payload: {
            salvageLines: lines,
            ...(tags?.length ? { tags } : {}),
            ...(releaseNote ? { releaseNote } : {}),
        },
    }
}

export function serializeSalvagePayload(payload: VaultSalvagePayload): string {
    return JSON.stringify(payload)
}

/** Dedupe, drop empty; throws if none or over cap. */
export function normalizeCompostSourceIds(ids: string[]): string[] {
    const seen = new Set<string>()
    const out: string[] = []
    for (const id of ids) {
        const t = id.trim()
        if (!t || seen.has(t)) continue
        seen.add(t)
        out.push(t)
    }
    if (out.length === 0) {
        throw new Error('Select at least one item to compost.')
    }
    if (out.length > COMPOST_MAX_SOURCES) {
        throw new Error(`Select at most ${COMPOST_MAX_SOURCES} items per session.`)
    }
    return out
}
