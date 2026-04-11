#!/usr/bin/env tsx
/**
 * Seeds the Mastering the Game of Allyship (MTGOA) spatial world.
 *
 * Creates:
 *   - SpatialMap "Mastering the Game of Allyship World"
 *   - Instance with slug `mastering-allyship`, linked to the map
 *   - 1 octagon clearing room (mtgoa-clearing) with 8 spoke portals + return-to-BB
 *   - 8 spoke intro rooms (each with 6 face NPCs + 4 nursery portals + return to clearing)
 *   - 32 nursery rooms (4 per spoke: wake-up, clean-up, grow-up, show-up)
 *
 * Mirrors the structure created by:
 *   scripts/seed-bb-campaign-octagon-room.ts (clearing)
 *   scripts/seed-nursery-rooms.ts (intro + nursery rooms)
 *
 * The clearing's south portal is overridden to point back to the Bruised Banana clearing
 * (since MTGOA is a sub-hub of BB), instead of the default Card Club path.
 *
 * Each spoke intro's "Return to Campaign Hub" portal is overridden to point to the MTGOA
 * spatial clearing (not the legacy /campaign/hub fallback).
 *
 * Idempotent: finds existing rows by slug/name, updates rather than duplicates.
 *
 * Usage: npx tsx scripts/seed-mtgoa-spatial-world.ts
 */
import './require-db-env'
import { PrismaClient } from '@prisma/client'
import { buildOctagonCampaignHubRoom } from '../src/lib/spatial-world/octagon-campaign-hub'
import {
    buildSpokeNurseryRooms,
    NURSERY_TYPES,
    NURSERY_LABELS,
    spokeIntroSlug,
    nurseryRoomSlug,
} from '../src/lib/spatial-world/nursery-rooms'

const prisma = new PrismaClient()

const MTGOA_MAP_NAME = 'Mastering the Game of Allyship World'
const MTGOA_INSTANCE_SLUG = 'mastering-allyship'
const MTGOA_INSTANCE_NAME = 'Mastering the Game of Allyship'
const MTGOA_CAMPAIGN_REF = 'mastering-allyship'
const MTGOA_CLEARING_SLUG = 'mtgoa-clearing'
const MTGOA_CLEARING_NAME = 'MTGOA Clearing'

const BB_INSTANCE_SLUG = 'bruised-banana'
const BB_CLEARING_SLUG = 'bb-campaign-clearing'

async function upsertRoom(
    mapId: string,
    slug: string,
    name: string,
    tilemap: Record<string, unknown>,
    anchors: Array<{
        anchorType: string
        tileX: number
        tileY: number
        label: string
        config?: string | null
        linkedId?: string | null
        linkedType?: string | null
    }>,
    sortOrder: number,
) {
    const existing = await prisma.mapRoom.findFirst({ where: { mapId, slug } })
    const room = existing
        ? await prisma.mapRoom.update({
              where: { id: existing.id },
              data: {
                  name,
                  tilemap: JSON.stringify(tilemap),
                  sortOrder,
              },
          })
        : await prisma.mapRoom.create({
              data: {
                  mapId,
                  name,
                  slug,
                  tilemap: JSON.stringify(tilemap),
                  sortOrder,
              },
          })

    // Replace all anchors
    await prisma.spatialMapAnchor.deleteMany({ where: { roomId: room.id } })
    for (const a of anchors) {
        await prisma.spatialMapAnchor.create({
            data: {
                roomId: room.id,
                anchorType: a.anchorType,
                tileX: a.tileX,
                tileY: a.tileY,
                label: a.label,
                config: a.config ?? undefined,
                linkedId: a.linkedId ?? undefined,
                linkedType: a.linkedType ?? undefined,
            },
        })
    }

    return { room, anchorCount: anchors.length }
}

async function main() {
    console.log('--- Seeding MTGOA Spatial World ---\n')

    // ── 1. SpatialMap ────────────────────────────────────────────────────────
    let map = await prisma.spatialMap.findFirst({ where: { name: MTGOA_MAP_NAME } })
    if (!map) {
        map = await prisma.spatialMap.create({
            data: {
                name: MTGOA_MAP_NAME,
                mapType: 'campaign_map',
                spawnpoint: JSON.stringify({ roomIndex: 0, x: 12, y: 12 }),
            },
        })
        console.log(`✅ Created SpatialMap "${MTGOA_MAP_NAME}" (${map.id})`)
    } else {
        console.log(`ℹ  Found existing SpatialMap "${MTGOA_MAP_NAME}" (${map.id})`)
    }

    // ── 2. Instance ──────────────────────────────────────────────────────────
    let instance = await prisma.instance.findFirst({ where: { slug: MTGOA_INSTANCE_SLUG } })
    if (!instance) {
        instance = await prisma.instance.create({
            data: {
                slug: MTGOA_INSTANCE_SLUG,
                name: MTGOA_INSTANCE_NAME,
                domainType: 'RAISE_AWARENESS',
                campaignRef: MTGOA_CAMPAIGN_REF,
                spatialMapId: map.id,
                kotterStage: 1,
                targetDescription:
                    'An 8-spoke curriculum that teaches players the practice of allyship through emotional alchemy, role mastery, and quest design. The Book/Game spoke of the MTGOA Organization campaign.',
            },
        })
        console.log(`✅ Created Instance "${MTGOA_INSTANCE_SLUG}" (${instance.id})`)
    } else {
        if (instance.spatialMapId !== map.id) {
            instance = await prisma.instance.update({
                where: { id: instance.id },
                data: { spatialMapId: map.id },
            })
            console.log(`✅ Updated Instance to link to MTGOA SpatialMap`)
        } else {
            console.log(`ℹ  Found existing Instance "${MTGOA_INSTANCE_SLUG}" (${instance.id})`)
        }
    }

    // ── 3. MTGOA Clearing (octagon) ──────────────────────────────────────────
    const { tilemap: clearingTiles, anchors: clearingAnchorsRaw } = buildOctagonCampaignHubRoom(
        MTGOA_CAMPAIGN_REF,
        25,
    )

    // Override the south "Card Club" portal → return to Bruised Banana clearing.
    // The builder always emits the Card Club portal as anchors[0].
    const clearingAnchors = clearingAnchorsRaw.map((a, idx) => {
        if (idx === 0 && a.label === 'Card Club') {
            return {
                ...a,
                label: 'Return to Bruised Banana',
                config: JSON.stringify({
                    externalPath: `/world/${BB_INSTANCE_SLUG}/${BB_CLEARING_SLUG}`,
                }),
            }
        }
        return a
    })

    const { anchorCount: clearingAnchorCount } = await upsertRoom(
        map.id,
        MTGOA_CLEARING_SLUG,
        MTGOA_CLEARING_NAME,
        clearingTiles,
        clearingAnchors,
        10,
    )
    console.log(`✅ Upserted clearing "${MTGOA_CLEARING_SLUG}" with ${clearingAnchorCount} anchors\n`)

    // ── 4. Spoke intro rooms + 4 nurseries each ──────────────────────────────
    let totalRooms = 1 // count clearing
    let totalAnchors = clearingAnchorCount

    for (let spokeIndex = 0; spokeIndex < 8; spokeIndex++) {
        console.log(`Spoke ${spokeIndex}:`)
        const rooms = buildSpokeNurseryRooms(MTGOA_CAMPAIGN_REF, spokeIndex)

        // Override intro room "Return to Campaign Hub" portal to point to spatial clearing.
        // The builder emits it as the second anchor (after welcome_text).
        const introAnchors = rooms.intro.anchors.map((a) => {
            if (a.anchorType === 'portal' && a.label === 'Return to Campaign Hub') {
                return {
                    ...a,
                    label: 'Return to MTGOA Clearing',
                    config: JSON.stringify({
                        targetSlug: MTGOA_CLEARING_SLUG,
                    }),
                }
            }
            return a
        })

        const baseSortOrder = 20 + spokeIndex * 10

        const introSlug = spokeIntroSlug(spokeIndex)
        const { anchorCount: introAnchorCount } = await upsertRoom(
            map.id,
            introSlug,
            `MTGOA Spoke ${spokeIndex + 1} — Clearing`,
            rooms.intro.tilemap,
            introAnchors,
            baseSortOrder,
        )
        console.log(`  ✅ ${introSlug} — ${introAnchorCount} anchors`)
        totalRooms++
        totalAnchors += introAnchorCount

        // 4 nursery rooms
        for (let i = 0; i < NURSERY_TYPES.length; i++) {
            const nt = NURSERY_TYPES[i]
            const slug = nurseryRoomSlug(spokeIndex, nt)
            const { anchorCount } = await upsertRoom(
                map.id,
                slug,
                `MTGOA Spoke ${spokeIndex + 1} — ${NURSERY_LABELS[nt]}`,
                rooms.nurseries[nt].tilemap,
                rooms.nurseries[nt].anchors,
                baseSortOrder + i + 1,
            )
            console.log(`  ✅ ${slug} — ${anchorCount} anchors`)
            totalRooms++
            totalAnchors += anchorCount
        }
        console.log()
    }

    console.log(`──────────────────────────────────────────`)
    console.log(`✅ MTGOA spatial world seeded:`)
    console.log(`   ${totalRooms} rooms, ${totalAnchors} anchors`)
    console.log(`   Visit: /world/${MTGOA_INSTANCE_SLUG}/${MTGOA_CLEARING_SLUG}`)
    console.log(`──────────────────────────────────────────`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
