'use client'

import { useState } from 'react'
import {
    parseAvatarConfig,
    getAvatarHue,
    getAvatarInitials,
} from '@/lib/avatar-utils'
import { getAvatarPartSpecs } from '@/lib/avatar-parts'
import type { ElementKey } from '@/lib/ui/card-tokens'
import { REGISTER_PORTRAIT_IMG_CLASSES, registerPortraitShellStyle } from '@/lib/ui/register-portrait'

type AvatarProps = {
    player: { name: string; avatarConfig?: string | null; pronouns?: string | null; id?: string }
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
    /** ARDS Register 3: upward crop + optional element vignette (panels, trade UI). */
    register3?: boolean
    /** When set with register3, applies frame/glow from ELEMENT_TOKENS. */
    element?: ElementKey
}

const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-64 h-64 text-4xl'
}

export function Avatar({
    player,
    size = 'md',
    className = '',
    register3 = false,
    element
}: AvatarProps) {
    const config = parseAvatarConfig(player.avatarConfig ?? null)
    const initials = getAvatarInitials(config, player.name)
    const hue = getAvatarHue(config)
    const sizeClass = sizeClasses[size]

    const [failedLayers, setFailedLayers] = useState<Set<string>>(new Set())
    const specs = config ? getAvatarPartSpecs(config) : []
    const visibleSpecs = specs.filter((s) => !failedLayers.has(s.layer))
    const showFallback =
        specs.length === 0 || visibleSpecs.length === 0 || failedLayers.has('base')

    const handleLayerError = (layer: string) => {
        setFailedLayers((prev) => new Set(prev).add(layer))
    }

    if (showFallback) {
        return (
            <div
                className={`inline-flex items-center justify-center rounded-full font-bold text-white shrink-0 ${sizeClass} ${className}`}
                style={{
                    backgroundColor: config
                        ? `hsl(${hue}, 50%, 40%)`
                        : 'hsl(220, 20%, 25%)',
                    border: '2px solid hsl(var(--border) / 0.3)'
                }}
                title={player.name}
            >
                {initials}
            </div>
        )
    }

    const layerClass = register3 ? REGISTER_PORTRAIT_IMG_CLASSES : 'absolute inset-0 w-full h-full object-contain'
    const shellStyle =
        register3 && element
            ? { ...registerPortraitShellStyle(element), border: 'none' as const }
            : { border: '2px solid hsl(var(--border) / 0.3)' }

    return (
        <div
            className={`relative overflow-hidden rounded-full shrink-0 bg-zinc-900 ${sizeClass} ${className}`}
            style={shellStyle}
            title={player.name}
        >
            {visibleSpecs.map((spec) => (
                <img
                    key={spec.layer}
                    src={spec.path}
                    alt=""
                    className={layerClass}
                    onError={() => handleLayerError(spec.layer)}
                />
            ))}
        </div>
    )
}
