'use client'

import { useState } from 'react'
import {
    parseAvatarConfig,
    getAvatarHue,
    getAvatarInitials,
    type AvatarConfig
} from '@/lib/avatar-utils'
import { getAvatarPartSpecs } from '@/lib/avatar-parts'

type AvatarProps = {
    player: { name: string; avatarConfig?: string | null; pronouns?: string | null; id?: string }
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-64 h-64 text-4xl'
}

export function Avatar({ player, size = 'md', className = '' }: AvatarProps) {
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

    return (
        <div
            className={`relative overflow-hidden rounded-full shrink-0 bg-zinc-900 ${sizeClass} ${className}`}
            style={{ border: '2px solid hsl(var(--border) / 0.3)' }}
            title={player.name}
        >
            {visibleSpecs.map((spec) => (
                <img
                    key={spec.layer}
                    src={spec.path}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain"
                    onError={() => handleLayerError(spec.layer)}
                />
            ))}
        </div>
    )
}
