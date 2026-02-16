import { createHash } from 'node:crypto'

export type ForensicsStyleCheck = {
    stage: 'first_pass' | 'after_repair'
    code: string
    pass: boolean
    message: string
    fieldPath?: string
}

export type QuestGenerationTrace = {
    generator_version: string
    timestamp: string
    seed: string | null
    model_params: {
        provider: string
        model: string
        temperature: number | null
        top_p: number | null
        max_tokens: number | null
    }
    cache_status: {
        layer: 'completionEffects.aiBody'
        status: 'hit' | 'miss' | 'bypass'
        cache_key: string
        reason?: string
    }
    inputs_fingerprint: string
    retrieval_fingerprint: string
    retrieval_query_fingerprint: string
    prompt_fingerprint: string
    postprocess_steps: Array<{ name: string; version: string }>
    style_guide_checks: ForensicsStyleCheck[]
    output_fingerprint: string
}

function sortValue(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((item) => sortValue(item))
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, item]) => [key, sortValue(item)] as const)
        return Object.fromEntries(entries)
    }
    return value
}

export function normalizeInputs(input: unknown): unknown {
    const volatileKeys = new Set([
        'timestamp',
        'createdAt',
        'updatedAt',
        'aiGeneratedAt',
        'requestId',
        'traceId',
    ])

    function normalize(value: unknown): unknown {
        if (Array.isArray(value)) {
            return value.map((item) => normalize(item))
        }
        if (value && typeof value === 'object') {
            const entries = Object.entries(value as Record<string, unknown>)
                .filter(([key]) => !volatileKeys.has(key))
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, item]) => [key, normalize(item)] as const)
            return Object.fromEntries(entries)
        }
        return value
    }

    return normalize(input)
}

export function stableJsonStringify(value: unknown) {
    return JSON.stringify(sortValue(value))
}

export function sha256Fingerprint(value: unknown) {
    const input = typeof value === 'string' ? value : stableJsonStringify(value)
    return createHash('sha256').update(input).digest('hex')
}

export function composeQuestCacheKey(parts: {
    version: string
    questId: string
    seed: string | null
    inputsFingerprint: string
}) {
    return [
        `v=${parts.version}`,
        `quest=${parts.questId}`,
        `seed=${parts.seed ?? 'null'}`,
        `inputs=${parts.inputsFingerprint}`,
    ].join('|')
}

export function percentageDistinct(values: string[]) {
    if (values.length === 0) return 0
    const unique = new Set(values.filter((value) => value.length > 0)).size
    return Math.round((unique / values.length) * 10000) / 100
}

export function percentageMatches(values: boolean[]) {
    if (values.length === 0) return 0
    const matches = values.filter(Boolean).length
    return Math.round((matches / values.length) * 10000) / 100
}

export function resolveGeneratorVersion() {
    return process.env.VERCEL_GIT_COMMIT_SHA
        || process.env.GIT_COMMIT
        || process.env.npm_package_version
        || 'dev'
}
