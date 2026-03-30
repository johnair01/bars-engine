'use client'

import { lookupCardArt } from '@/lib/ui/card-art-registry'
import { type ElementKey } from '@/lib/ui/card-tokens'
import { Avatar } from '@/components/Avatar'

type PlayerArtBadgeProps = {
    player: {
        name: string
        avatarConfig?: string | null
        archetype?: { name: string } | null
        nation?: { element: string | null } | null
    }
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
}

/**
 * PlayerArtBadge — Surface 7
 * 48x48px (md) identity marker that uses Cosmic Card Art when available,
 * falling back to the standard Avatar sprite composite.
 */
export function PlayerArtBadge({ player, size = 'md', className = '' }: PlayerArtBadgeProps) {
    const archetypeName = player.archetype?.name
    const element = (player.nation?.element as ElementKey) || 'earth'

    // Attempt lookup if we have an archetype
    const artEntry = archetypeName ? lookupCardArt(archetypeName, element) : null
    const sizeClass = sizeMap[size]

    if (artEntry) {
        return (
            <div className={`relative overflow-hidden rounded-lg shrink-0 border border-white/10 shadow-inner bg-black ${sizeClass} ${className}`}>
                <img
                    src={artEntry.publicPath}
                    alt={player.name}
                    className="w-full h-full object-cover object-[center_15%]"
                />
                {/* Subtle element-colored glow at the bottom */}
                <div
                    className="absolute inset-x-0 bottom-0 h-1 opacity-50"
                    style={{ backgroundColor: `var(--element-glow, ${element === 'fire' ? '#e8671a' : '#bdc3c7'})` }}
                />
            </div>
        )
    }

    // Fallback to standard Avatar
    return (
        <Avatar
            player={{
                name: player.name,
                avatarConfig: player.avatarConfig,
                id: (player as any).id
            }}
            size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
            className={`${className} rounded-lg`} // Force rounded-lg instead of circle for "Badge" feel
        />
    )
}
