'use client'

import { useState } from 'react'
import {
    getAvatarHue,
    slugifyName,
    type AvatarConfig
} from '@/lib/avatar-utils'
import {
    getUnlockedLayersForNode,
    getAvatarPartSpecsForProgress
} from '@/lib/avatar-parts'

type OnboardingAvatarPreviewProps = {
    campaignState: Record<string, unknown>
    currentNodeId: string
}

function buildConfigFromState(state: Record<string, unknown>): AvatarConfig | null {
    const nationKey =
        typeof state.nationKey === 'string' && state.nationKey
            ? state.nationKey
            : typeof state.nation === 'string' && state.nation
              ? slugifyName(state.nation)
              : ''
    const playbookKey =
        typeof state.playbookKey === 'string' && state.playbookKey
            ? state.playbookKey
            : typeof state.playbook === 'string' && state.playbook
              ? slugifyName(state.playbook)
              : ''

    if (!nationKey && !playbookKey) {
        return {
            nationKey: 'unknown',
            archetypeKey: 'unknown',
            variant: 'default',
            genderKey: 'default'
        }
    }
    return {
        nationKey: nationKey || 'unknown',
        archetypeKey: playbookKey || 'unknown',
        variant: 'default',
        genderKey: 'default'
    }
}

export function OnboardingAvatarPreview({
    campaignState,
    currentNodeId
}: OnboardingAvatarPreviewProps) {
    const [failedLayers, setFailedLayers] = useState<Set<string>>(new Set())
    const config = buildConfigFromState(campaignState)
    const unlockedLayers = getUnlockedLayersForNode(currentNodeId, campaignState)
    const specs = getAvatarPartSpecsForProgress(config, unlockedLayers)
    const visibleSpecs = specs.filter((s) => !failedLayers.has(s.layer))
    const showFallback = specs.length === 0 || visibleSpecs.length === 0

    const initials = config
        ? `${(config.nationKey || '').charAt(0)}${(config.archetypeKey || '').charAt(0)}`.toUpperCase() || '?'
        : '?'
    const hue = getAvatarHue(config)

    const handleLayerError = (layer: string) => {
        setFailedLayers((prev) => new Set(prev).add(layer))
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
                Your character
            </span>
            <div
                className={`relative overflow-hidden rounded-full shrink-0 w-16 h-16`}
                style={{
                    border: '2px solid hsl(var(--border) / 0.3)',
                    backgroundColor: showFallback
                        ? `hsl(${hue}, 50%, 40%)`
                        : 'transparent'
                }}
            >
                {showFallback ? (
                    <span
                        className="absolute inset-0 flex items-center justify-center font-bold text-white text-lg"
                        style={{ backgroundColor: `hsl(${hue}, 50%, 40%)` }}
                    >
                        {initials}
                    </span>
                ) : (
                    visibleSpecs.map((spec) => (
                        <img
                            key={spec.layer}
                            src={spec.path}
                            alt=""
                            className="absolute inset-0 w-full h-full object-contain"
                            onError={() => handleLayerError(spec.layer)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
