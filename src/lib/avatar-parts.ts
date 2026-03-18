/**
 * Composable sprite parts for JRPG-style avatars.
 * Parts stack in defined order; nation and playbook select layers.
 */

import type { AvatarConfig } from './avatar-utils'

/** Character Creator phase (matches CharacterCreatorRunner) */
export type CharacterCreatorPhase =
    | 'landing'
    | 'discovery'
    | 'archetype_reveal'
    | 'archetype_alternatives'
    | 'archetype_moves'
    | 'nation_discovery'
    | 'nation_moves'
    | 'story_community'
    | 'story_dreams'
    | 'story_fears'
    | 'complete'

/** Source of avatar progress (BB campaign, Character Creator, or profile) */
export type ProgressSource = 'bb' | 'character-creator' | 'onboarding-profile'

/** State for computing unlocked layers (source-agnostic) */
export type ProgressState = {
    nationId?: string | null
    archetypeId?: string | null
    campaignDomainPreference?: string[] | string | null
    /** Character Creator: current phase */
    phase?: CharacterCreatorPhase
    /** Character Creator: resolved archetype name (for archetypeKey) */
    resolvedArchetypeName?: string | null
    /** Character Creator: resolved nation name (for nationKey) */
    resolvedNationName?: string | null
    selectedArchetypeMoves?: string[]
    selectedNationMoves?: string[]
}

export type PartLayer =
    | 'base'
    | 'nation_body'
    | 'nation_accent'
    | 'archetype_outfit'
    | 'archetype_accent'

export type PartSpec = {
    layer: PartLayer
    key: string
    path: string
}

/**
 * Map PartLayer to filesystem directory. Archetype layers use playbook_* dirs (assets not yet renamed).
 */
export function getSpriteDirForLayer(layer: string): string {
    if (layer === 'archetype_outfit') return 'playbook_outfit'
    if (layer === 'archetype_accent') return 'playbook_accent'
    return layer
}

/**
 * Get ordered part specs for full avatar from config.
 */
export function getAvatarPartSpecs(config: AvatarConfig | null): PartSpec[] {
    if (!config) return []

    const specs: PartSpec[] = []
    const genderKey = config.genderKey ?? 'default'
    specs.push({ layer: 'base', key: genderKey, path: `/sprites/parts/base/${genderKey}.png` })

    if (config.nationKey) {
        specs.push({
            layer: 'nation_body',
            key: config.nationKey,
            path: `/sprites/parts/nation_body/${config.nationKey}.png`
        })
    }
    if (config.archetypeKey) {
        const dir = getSpriteDirForLayer('archetype_outfit')
        specs.push({
            layer: 'archetype_outfit',
            key: config.archetypeKey,
            path: `/sprites/parts/${dir}/${config.archetypeKey}.png`
        })
    }
    if (config.nationKey) {
        specs.push({
            layer: 'nation_accent',
            key: config.nationKey,
            path: `/sprites/parts/nation_accent/${config.nationKey}.png`
        })
    }
    if (config.archetypeKey) {
        const dir = getSpriteDirForLayer('archetype_accent')
        specs.push({
            layer: 'archetype_accent',
            key: config.archetypeKey,
            path: `/sprites/parts/${dir}/${config.archetypeKey}.png`
        })
    }
    return specs
}

/**
 * Get which layers are unlocked at current BB step.
 * Delegates to getUnlockedLayersForProgress when source is 'bb'.
 */
export function getUnlockedLayersForNode(
    nodeId: string,
    campaignState: Record<string, unknown>
): PartLayer[] {
    return getUnlockedLayersForProgress('bb', campaignState as ProgressState, nodeId)
}

/**
 * Get unlocked layers from any progress source (BB, Character Creator, profile).
 * Single source of truth for phase/node → layer mapping.
 */
export function getUnlockedLayersForProgress(
    source: ProgressSource,
    state: ProgressState,
    nodeId?: string
): PartLayer[] {
    const layers: PartLayer[] = ['base']

    if (source === 'bb') {
        if (
            (nodeId && /^BB_SetNation_|^BB_NationInfo_|^BB_ChooseNation/.test(nodeId)) ||
            state.nationId
        ) {
            layers.push('nation_body')
        }
        if (
            (nodeId && /^BB_SetPlaybook_|^BB_PlaybookInfo_|^BB_ChoosePlaybook/.test(nodeId)) ||
            state.archetypeId
        ) {
            layers.push('archetype_outfit')
        }
        if (
            (nodeId && /^BB_SetDomain_|^BB_ChooseDomain/.test(nodeId)) ||
            state.campaignDomainPreference
        ) {
            layers.push('nation_accent')
        }
        if (nodeId && /^BB_Moves_/.test(nodeId)) {
            layers.push('archetype_accent')
        }
        return layers
    }

    if (source === 'character-creator') {
        const phase = state.phase
        if (
            phase === 'archetype_reveal' ||
            phase === 'archetype_alternatives' ||
            phase === 'archetype_moves'
        ) {
            layers.push('archetype_outfit')
        }
        if (
            phase === 'nation_discovery' ||
            phase === 'nation_moves' ||
            phase === 'story_community' ||
            phase === 'story_dreams' ||
            phase === 'story_fears' ||
            phase === 'complete'
        ) {
            layers.push('nation_body')
            layers.push('archetype_outfit')
        }
        if (
            phase === 'nation_moves' ||
            phase === 'story_community' ||
            phase === 'story_dreams' ||
            phase === 'story_fears' ||
            phase === 'complete'
        ) {
            layers.push('nation_accent')
        }
        if (
            phase === 'story_community' ||
            phase === 'story_dreams' ||
            phase === 'story_fears' ||
            phase === 'complete'
        ) {
            layers.push('archetype_accent')
        }
        return layers
    }

    if (source === 'onboarding-profile') {
        if (state.nationId || state.resolvedNationName) {
            layers.push('nation_body')
            layers.push('nation_accent')
        }
        if (state.archetypeId || state.resolvedArchetypeName) {
            layers.push('archetype_outfit')
            layers.push('archetype_accent')
        }
        return layers
    }

    return layers
}

/**
 * Filter part specs to only include unlocked layers.
 */
export function getAvatarPartSpecsForProgress(
    config: AvatarConfig | null,
    unlockedLayers: PartLayer[]
): PartSpec[] {
    const all = getAvatarPartSpecs(config)
    const set = new Set(unlockedLayers)
    return all.filter((s) => set.has(s.layer))
}
