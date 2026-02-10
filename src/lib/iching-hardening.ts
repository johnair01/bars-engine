import type { PrismaClient } from '@prisma/client'

type PrismaDb = Pick<PrismaClient, 'customBar' | 'starterPack'>

const ORIENTATION_QUEST_ID = 'orientation-quest-3'
const ICHING_TRIGGER = 'ICHING_CAST'
const LEGACY_ICHING_ACTIVE_BAR_REGEX = /^iching_\d+$/

type TriggerInput = {
    trigger?: unknown
    [key: string]: unknown
}

type StarterPackPayload = {
    activeBars?: unknown
    [key: string]: unknown
}

export type OrientationTriggerResult = {
    questFound: boolean
    updated: boolean
}

export type LegacyStarterPackCleanupResult = {
    packsScanned: number
    packsUpdated: number
    entriesRemoved: number
    invalidJsonPacks: number
}

export type IChingHardeningReport = {
    orientationTrigger: OrientationTriggerResult
    legacyStarterPackCleanup: LegacyStarterPackCleanupResult
}

function parseTriggerInputs(inputsJson: string | null): TriggerInput[] {
    if (!inputsJson) return []

    try {
        const parsed = JSON.parse(inputsJson)
        if (!Array.isArray(parsed)) return []
        return parsed.filter((item): item is TriggerInput => !!item && typeof item === 'object')
    } catch {
        return []
    }
}

function hasIChingTrigger(inputs: TriggerInput[]): boolean {
    return inputs.some((input) => input.trigger === ICHING_TRIGGER)
}

export async function ensureOrientationQuest3IChingTrigger(prisma: PrismaDb): Promise<OrientationTriggerResult> {
    const quest = await prisma.customBar.findUnique({
        where: { id: ORIENTATION_QUEST_ID },
        select: { id: true, inputs: true }
    })

    if (!quest) {
        return { questFound: false, updated: false }
    }

    const inputs = parseTriggerInputs(quest.inputs)
    if (hasIChingTrigger(inputs)) {
        return { questFound: true, updated: false }
    }

    await prisma.customBar.update({
        where: { id: ORIENTATION_QUEST_ID },
        data: {
            inputs: JSON.stringify([...inputs, { trigger: ICHING_TRIGGER }])
        }
    })

    return { questFound: true, updated: true }
}

function parseStarterPackData(data: string): { parsed: StarterPackPayload | null; invalid: boolean } {
    try {
        const parsed = JSON.parse(data)
        if (!parsed || typeof parsed !== 'object') {
            return { parsed: null, invalid: true }
        }
        return { parsed: parsed as StarterPackPayload, invalid: false }
    } catch {
        return { parsed: null, invalid: true }
    }
}

function removeLegacyIChingActiveBars(payload: StarterPackPayload): { next: StarterPackPayload; removed: number } {
    const activeBarsRaw = payload.activeBars
    if (!Array.isArray(activeBarsRaw)) {
        return { next: payload, removed: 0 }
    }

    const activeBars = activeBarsRaw.filter((value): value is string => typeof value === 'string')
    const filtered = activeBars.filter((id) => !LEGACY_ICHING_ACTIVE_BAR_REGEX.test(id))
    const removed = activeBars.length - filtered.length

    if (removed === 0) {
        return { next: payload, removed: 0 }
    }

    return {
        next: { ...payload, activeBars: filtered },
        removed
    }
}

export async function cleanupLegacyIChingStarterPackState(prisma: PrismaDb): Promise<LegacyStarterPackCleanupResult> {
    const packs = await prisma.starterPack.findMany({
        select: { id: true, data: true }
    })

    let packsUpdated = 0
    let entriesRemoved = 0
    let invalidJsonPacks = 0

    for (const pack of packs) {
        const { parsed, invalid } = parseStarterPackData(pack.data)
        if (invalid || !parsed) {
            invalidJsonPacks += 1
            continue
        }

        const { next, removed } = removeLegacyIChingActiveBars(parsed)
        if (removed === 0) continue

        await prisma.starterPack.update({
            where: { id: pack.id },
            data: { data: JSON.stringify(next) }
        })

        packsUpdated += 1
        entriesRemoved += removed
    }

    return {
        packsScanned: packs.length,
        packsUpdated,
        entriesRemoved,
        invalidJsonPacks
    }
}

export async function runIChingHardening(prisma: PrismaDb): Promise<IChingHardeningReport> {
    const orientationTrigger = await ensureOrientationQuest3IChingTrigger(prisma)
    const legacyStarterPackCleanup = await cleanupLegacyIChingStarterPackState(prisma)

    return {
        orientationTrigger,
        legacyStarterPackCleanup
    }
}
