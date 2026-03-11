/**
 * Composable sprite parts for JRPG-style avatars.
 * Parts stack in defined order; nation and playbook select layers.
 */

import type { AvatarConfig } from './avatar-utils'

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
        specs.push({
            layer: 'archetype_outfit',
            key: config.archetypeKey,
            path: `/sprites/parts/archetype_outfit/${config.archetypeKey}.png`
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
        specs.push({
            layer: 'archetype_accent',
            key: config.archetypeKey,
            path: `/sprites/parts/archetype_accent/${config.archetypeKey}.png`
        })
    }
    return specs
}

/**
 * Get which layers are unlocked at current BB step.
 */
export function getUnlockedLayersForNode(
    nodeId: string,
    campaignState: Record<string, unknown>
): PartLayer[] {
    const layers: PartLayer[] = ['base']

    if (
        /^BB_SetNation_|^BB_NationInfo_|^BB_ChooseNation/.test(nodeId) ||
        campaignState.nationId
    ) {
        layers.push('nation_body')
    }
    if (
        /^BB_SetPlaybook_|^BB_PlaybookInfo_|^BB_ChoosePlaybook/.test(nodeId) ||
        campaignState.archetypeId
    ) {
        layers.push('archetype_outfit')
    }
    if (
        /^BB_SetDomain_|^BB_ChooseDomain/.test(nodeId) ||
        campaignState.campaignDomainPreference
    ) {
        layers.push('nation_accent')
    }
    if (/^BB_Moves_/.test(nodeId)) {
        layers.push('archetype_accent')
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
