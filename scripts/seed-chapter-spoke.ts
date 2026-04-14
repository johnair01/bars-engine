#!/usr/bin/env tsx
/**
 * Chapter-Spoke seed script.
 *
 * Reads a ChapterDefinition file, registers it via registerChapterSpoke(),
 * and creates the spatial world (SpatialMap + Instance + MapRoom + anchors).
 *
 * Idempotent: safe to re-run — upserts by chapterRef/slug/name.
 *
 * Usage:
 *   npx tsx scripts/seed-chapter-spoke.ts mtgoa-chapter-1
 *
 * The argument is the chapterRef, which must match a file at:
 *   data/chapters/<bookSlug>/chapter-N.ts (resolved from the definition's bookRef)
 *
 * Currently supported chapter refs:
 *   mtgoa-chapter-1  →  data/chapters/mtgoa/chapter-1.ts
 *
 * See: .specify/specs/chapter-spoke-template/spec.md
 */

import './require-db-env'
import { PrismaClient } from '@prisma/client'
import type { ChapterDefinition } from '../src/lib/chapter-spoke/types'
import { buildOctagonTilemap } from '../src/lib/spatial-world/octagon-campaign-hub'

const prisma = new PrismaClient()

// ─── Chapter registry ─────────────────────────────────────────────────────────

const CHAPTER_FILES: Record<string, string> = {
  'mtgoa-chapter-1': '../data/chapters/mtgoa/chapter-1',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertChapterRegistration(def: ChapterDefinition) {
  await prisma.chapterRegistration.upsert({
    where: { chapterRef: def.chapterRef },
    create: {
      chapterRef: def.chapterRef,
      bookRef: def.bookRef,
      orgRef: def.orgRef,
      version: def.version,
      definition: def as unknown as Record<string, unknown>,
    },
    update: {
      bookRef: def.bookRef,
      orgRef: def.orgRef,
      version: def.version,
      definition: def as unknown as Record<string, unknown>,
    },
  })
  console.log(`  ✓ ChapterRegistration: ${def.chapterRef} (v${def.version})`)
}

async function upsertChapterMilestone(def: ChapterDefinition) {
  const m = def.milestone
  await prisma.chapterMilestone.upsert({
    where: { chapterRef: def.chapterRef },
    create: {
      chapterRef: def.chapterRef,
      bookRef: def.bookRef,
      title: m.title,
      description: m.description,
      parentMilestoneRef: m.rollupTo.parentMilestoneRef,
      rollupWeight: m.rollupTo.weight,
      minBarsRequired: m.completionCriteria.minBarsRequired,
    },
    update: {
      title: m.title,
      description: m.description,
      parentMilestoneRef: m.rollupTo.parentMilestoneRef,
      rollupWeight: m.rollupTo.weight,
      minBarsRequired: m.completionCriteria.minBarsRequired,
    },
  })
  console.log(`  ✓ ChapterMilestone: ${m.milestoneRef}`)
}

async function upsertSpatialWorld(def: ChapterDefinition) {
  // Each chapter spoke gets its own SpatialMap + Instance.
  // Instance slug = chapterRef (e.g. 'mtgoa-chapter-1').
  // This is how resolveChapterContext() finds chapters by instanceSlug.
  const instanceSlug = def.chapterRef
  const mapName = `${def.title} — Spatial World`

  // 1. SpatialMap
  let map = await prisma.spatialMap.findFirst({ where: { name: mapName } })
  if (!map) {
    map = await prisma.spatialMap.create({
      data: {
        name: mapName,
        mapType: 'campaign_map',
        spawnpoint: JSON.stringify({ roomIndex: 0, x: 10, y: 4 }),
      },
    })
    console.log(`  ✓ SpatialMap created: "${mapName}"`)
  } else {
    console.log(`  · SpatialMap exists: "${mapName}"`)
  }

  // 2. Instance — slug must equal chapterRef for context resolution to work
  let instance = await prisma.instance.findFirst({ where: { slug: instanceSlug } })
  if (!instance) {
    instance = await prisma.instance.create({
      data: {
        slug: instanceSlug,
        name: def.title,
        domainType: 'RAISE_AWARENESS',
        campaignRef: def.chapterRef,
        spatialMapId: map.id,
        kotterStage: 1,
        targetDescription: def.description,
      },
    })
    console.log(`  ✓ Instance created: "${instanceSlug}"`)
  } else {
    await prisma.instance.update({
      where: { id: instance.id },
      data: { name: def.title, targetDescription: def.description },
    })
    console.log(`  · Instance updated: "${instanceSlug}"`)
  }

  // 3. Spatial rooms from the ChapterDefinition
  for (const roomDef of def.rooms) {
    const tilemap = buildOctagonTilemap(21) // 21-tile octagon

    // Find or create room
    const existingRoom = await prisma.mapRoom.findFirst({
      where: { mapId: map.id, slug: roomDef.slug },
    })
    const room = existingRoom
      ? await prisma.mapRoom.update({
          where: { id: existingRoom.id },
          data: { name: roomDef.name, tilemap: JSON.stringify(tilemap) },
        })
      : await prisma.mapRoom.create({
          data: {
            mapId: map.id,
            name: roomDef.name,
            slug: roomDef.slug,
            tilemap: JSON.stringify(tilemap),
            sortOrder: def.rooms.indexOf(roomDef),
          },
        })
    console.log(`  ✓ Room: "${roomDef.name}" (${room.id})`)

    // Replace anchors idempotently
    await prisma.spatialMapAnchor.deleteMany({ where: { roomId: room.id } })

    for (const anchor of roomDef.anchors) {
      const label = (anchor.config as Record<string, unknown>)?.label as string | undefined
        ?? anchor.type

      await prisma.spatialMapAnchor.create({
        data: {
          roomId: room.id,
          anchorType: anchor.type,
          tileX: anchor.tileX,
          tileY: anchor.tileY,
          label,
          config: JSON.stringify(anchor.config),
        },
      })
    }
    console.log(`    ✓ ${roomDef.anchors.length} anchors seeded`)
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const chapterRef = process.argv[2]

  if (!chapterRef) {
    console.error('Usage: npx tsx scripts/seed-chapter-spoke.ts <chapterRef>')
    console.error('Available:', Object.keys(CHAPTER_FILES).join(', '))
    process.exit(1)
  }

  const filePath = CHAPTER_FILES[chapterRef]
  if (!filePath) {
    console.error(`Unknown chapterRef: "${chapterRef}"`)
    console.error('Available:', Object.keys(CHAPTER_FILES).join(', '))
    process.exit(1)
  }

  console.log(`\n--- Seeding chapter spoke: ${chapterRef} ---\n`)

  // Dynamic import — avoids loading all chapters at startup
  const mod = await import(filePath) as Record<string, unknown>
  // Convention: default export or named export matching chapterRef (camelCase)
  const key = Object.keys(mod).find(k => k !== 'default') ?? 'default'
  const def = (mod[key] ?? mod.default) as ChapterDefinition

  if (!def?.chapterRef) {
    console.error(`Failed to load ChapterDefinition from ${filePath}`)
    process.exit(1)
  }

  await upsertChapterRegistration(def)
  await upsertChapterMilestone(def)
  await upsertSpatialWorld(def)

  console.log(`\n✅ Chapter spoke "${chapterRef}" seeded successfully.`)
  console.log(`   Players can enter at: /world/${def.chapterRef}/${def.entrySpoke.roomSlug}`)
  console.log(`   Book hub sees progress at: getBookMilestoneRollup('${def.bookRef}')`)
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
