import { db } from '@/lib/db'

export type ModifierEffectType = 'ADD_REFLECTION_INPUT'

export type AddReflectionInputPayload = {
    version: 1
    sourceBarId: string
    sourceBarTitle: string
    key: string
    label: string
    placeholder: string
}

export type RuntimeModifierInput = {
    modifierId: string
    effectType: ModifierEffectType
    key: string
    label: string
    placeholder: string
    sourceBarId: string
    sourceBarTitle: string
}

function isAddReflectionInputPayload(value: unknown): value is AddReflectionInputPayload {
    if (!value || typeof value !== 'object') return false
    const payload = value as Record<string, unknown>
    return (
        payload.version === 1 &&
        typeof payload.sourceBarId === 'string' &&
        typeof payload.sourceBarTitle === 'string' &&
        typeof payload.key === 'string' &&
        typeof payload.label === 'string' &&
        typeof payload.placeholder === 'string'
    )
}

export function buildReflectionModifierPayload(params: {
    sourceBarId: string
    sourceBarTitle: string
    sourceBarDescription?: string | null
}): AddReflectionInputPayload {
    const key = `modifier_echo_${params.sourceBarId.slice(-8)}`
    const placeholder = params.sourceBarDescription?.trim() || `Let "${params.sourceBarTitle}" alter how you approach this quest.`

    return {
        version: 1,
        sourceBarId: params.sourceBarId,
        sourceBarTitle: params.sourceBarTitle,
        key,
        label: `Modifier Echo — ${params.sourceBarTitle}`,
        placeholder,
    }
}

export function parseRuntimeModifierInput(modifier: { id: string, effectType: string, payload: string }): RuntimeModifierInput | null {
    if (modifier.effectType !== 'ADD_REFLECTION_INPUT') return null
    try {
        const parsed: unknown = JSON.parse(modifier.payload || '{}')
        if (!isAddReflectionInputPayload(parsed)) return null
        return {
            modifierId: modifier.id,
            effectType: 'ADD_REFLECTION_INPUT',
            key: parsed.key,
            label: parsed.label,
            placeholder: parsed.placeholder,
            sourceBarId: parsed.sourceBarId,
            sourceBarTitle: parsed.sourceBarTitle,
        }
    } catch {
        return null
    }
}

export async function getActiveRuntimeModifierInputsForQuest(questId: string): Promise<RuntimeModifierInput[]> {
    const modifiers = await db.questModifier.findMany({
        where: {
            targetQuestId: questId,
            status: 'active',
        },
        orderBy: { appliedAt: 'asc' },
        select: {
            id: true,
            effectType: true,
            payload: true,
        }
    })

    return modifiers
        .map(parseRuntimeModifierInput)
        .filter((input): input is RuntimeModifierInput => input !== null)
}

export function getMissingModifierResponseLabels(
    modifierInputs: RuntimeModifierInput[],
    responses: Record<string, unknown>
): string[] {
    const missing: string[] = []
    for (const input of modifierInputs) {
        const value = responses[input.key]
        if (typeof value !== 'string' || value.trim().length === 0) {
            missing.push(input.label)
        }
    }
    return missing
}

export async function consumeActiveModifiersForQuest(questId: string) {
    await db.questModifier.updateMany({
        where: {
            targetQuestId: questId,
            status: 'active',
        },
        data: {
            status: 'consumed',
            resolvedAt: new Date(),
        }
    })
}
