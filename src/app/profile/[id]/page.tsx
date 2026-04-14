import { dbBase as db } from '@/lib/db'
import { requirePlayer } from '@/lib/auth'
import { getOrCreateProfileMap } from '@/actions/profile-spatial'
import { ProfileView } from '@/components/profile/ProfileView'
import { resolveAvatarConfigForPlayer, getWalkableSpriteUrl, parseAvatarConfig } from '@/lib/avatar-utils'
import { Metadata } from 'next'

interface ProfilePageProps {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    const { id } = await params
    const player = await db.player.findUnique({ where: { id }, select: { name: true } })
    return {
        title: player ? `${player.name}'s Museum` : 'Personal Museum',
        description: 'Visit and explore the spatial trophy room of this avatar.',
    }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { id: profileId } = await params
    const currentPlayerId = await requirePlayer()
    const isOwner = profileId === currentPlayerId

    // 1. Fetch player & profile map
    const player = await db.player.findUnique({
        where: { id: profileId },
        include: { nation: true, archetype: true, quests: { include: { quest: true } } }
    })
    
    if (!player) return <div>Player not found.</div>

    // getOrCreateProfileMap handles the default trophy room creation
    const profileMap = await getOrCreateProfileMap() 
    const trophyRoom = profileMap.rooms.find(r => r.roomType === 'trophy_room') || profileMap.rooms[0]!

    // 2. Prep Avatar
    const avatarConfig = resolveAvatarConfigForPlayer(player)
    const walkableSpriteUrl = avatarConfig
        ? getWalkableSpriteUrl(parseAvatarConfig(avatarConfig))
        : null

    // 3. Prep Held Items
    const myCompletedQuests = player.quests
        .filter(pq => pq.status === 'completed')
        .map(pq => ({
            questId: pq.questId,
            quest: { name: pq.quest.title },
            completedAt: pq.completedAt?.toISOString() || null
        }))

    return (
        <ProfileView 
            player={{
                id: player.id,
                name: player.name,
                nation: player.nation,
                archetype: player.archetype,
            }}
            profileMap={profileMap as any}
            trophyRoom={trophyRoom as any}
            isOwner={isOwner}
            myCompletedQuests={myCompletedQuests}
            avatarInfo={{
                avatarConfig: avatarConfig ?? null,
                walkableSpriteUrl,
            }}
        />
    )
}
