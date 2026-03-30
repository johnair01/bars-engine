'use server'

import { dbBase as db } from '@/lib/db'
import { requirePlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const STARTING_TROPHY_CAPACITY = 8

/**
 * Ensures the player has a profile spatial map. 
 * If not, creates one with a default "Trophy Room".
 */
export async function getOrCreateProfileMap() {
    const playerId = await requirePlayer()

    let profileMap = await db.profileSpatialMap.findFirst({
        where: { playerId },
        include: {
            rooms: {
                include: { anchors: true }
            }
        }
    })

    if (!profileMap) {
        // Create the initial map and default room
        profileMap = await db.profileSpatialMap.create({
            data: {
                playerId,
                name: "Personal Museum",
                spawnpoint: JSON.stringify({ roomSlug: 'trophy-room', x: 5, y: 5 }),
                rooms: {
                    create: {
                        name: "Trophy Room",
                        slug: "trophy-room",
                        tilemap: JSON.stringify({}), // Empty initial tilemap
                        roomType: "trophy_room",
                        sortOrder: 0
                    }
                }
            },
            include: {
                rooms: {
                    include: { anchors: true }
                }
            }
        })
    }

    return profileMap
}

/**
 * Places a BAR or BarDeck in a Trophy Room slot (anchor).
 * Enforces the 8-slot starting capacity limit.
 */
export async function curateToTrophy(artifactId: string, artifactType: 'BAR' | 'BAR_DECK', tileX: number, tileY: number, label?: string) {
    const playerId = await requirePlayer()
    const profileMap = await getOrCreateProfileMap()
    const trophyRoom = profileMap.rooms.find(r => r.roomType === 'trophy_room')

    if (!trophyRoom) throw new Error("Trophy Room not found")

    // Check capacity
    if (trophyRoom.anchors.length >= STARTING_TROPHY_CAPACITY) {
        return { error: `Your Trophy Room is full (Max ${STARTING_TROPHY_CAPACITY} slots). Upgrade to a Museum for more space.` }
    }

    // Upsert anchor for this artifact
    const anchor = await db.profileMapAnchor.upsert({
        where: { 
            // In this version, we'll allow one anchor per artifact ID in the trophy room
            id: artifactId // Use the artifactId as the anchor ID for simplicity in curation
        },
        create: {
            id: artifactId,
            roomId: trophyRoom.id,
            anchorType: artifactType === 'BAR' ? 'bar' : 'bar_deck',
            tileX,
            tileY,
            label: label || `Curated ${artifactType}`,
            linkedId: artifactId,
            linkedType: artifactType
        },
        update: {
            tileX,
            tileY,
            label: label || `Curated ${artifactType}`
        }
    })

    revalidatePath(`/profile/${playerId}`)
    return { success: true, anchor }
}

/**
 * Standard save for the player-facing map editor.
 */
export async function updateProfileRoom(roomId: string, data: { name?: string, tilemap?: string }) {
    await requirePlayer() // Basic auth check

    const updated = await db.profileMapRoom.update({
        where: { id: roomId },
        data
    })

    return { success: true, updated }
}
