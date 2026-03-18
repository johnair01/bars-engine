'use client'

import { useState } from 'react'
import { getAvatarHue, slugifyName, type AvatarConfig } from '@/lib/avatar-utils'
import {
  getUnlockedLayersForProgress,
  getAvatarPartSpecsForProgress,
  type CharacterCreatorPhase,
} from '@/lib/avatar-parts'

type CharacterCreatorAvatarPreviewProps = {
  phase: CharacterCreatorPhase
  resolvedArchetypeName?: string | null
  resolvedNationName?: string | null
}

function buildConfigFromState(
  resolvedArchetypeName?: string | null,
  resolvedNationName?: string | null
): AvatarConfig | null {
  const archetypeKey = resolvedArchetypeName ? slugifyName(resolvedArchetypeName) : ''
  const nationKey = resolvedNationName ? slugifyName(resolvedNationName) : ''
  return {
    nationKey: nationKey || '',
    archetypeKey: archetypeKey || '',
    variant: 'default',
    genderKey: 'default',
  }
}

export function CharacterCreatorAvatarPreview({
  phase,
  resolvedArchetypeName,
  resolvedNationName,
}: CharacterCreatorAvatarPreviewProps) {
  const [failedLayers, setFailedLayers] = useState<Set<string>>(new Set())
  const config = buildConfigFromState(resolvedArchetypeName, resolvedNationName)
  const unlockedLayers = getUnlockedLayersForProgress('character-creator', {
    phase,
    resolvedArchetypeName,
    resolvedNationName,
  })
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
      <span className="text-xs text-zinc-500 uppercase tracking-wider">Your character</span>
      <div
        className="relative overflow-hidden rounded-full shrink-0 w-20 h-20"
        style={{
          border: '2px solid hsl(var(--border) / 0.3)',
          backgroundColor: showFallback ? `hsl(${hue}, 50%, 40%)` : 'transparent',
        }}
      >
        {showFallback ? (
          <span
            className="absolute inset-0 flex items-center justify-center font-bold text-white text-xl"
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
