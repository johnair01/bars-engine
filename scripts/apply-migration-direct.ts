/**
 * Emergency script: applies the 20260316000000 migration SQL directly.
 * Safe to run multiple times — each statement is wrapped in try/catch.
 * Run with: npx tsx scripts/apply-migration-direct.ts
 *
 * IMPORTANT: Uses DATABASE_URL (direct db.prisma.io:5432) NOT PRISMA_DATABASE_URL (Accelerate).
 * Accelerate returns "must be owner of table" for DDL. The direct URL has DDL permissions.
 * Both URLs connect to the same underlying Postgres — DDL applied here is visible via Accelerate.
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { PrismaClient } from '@prisma/client'

// MUST use DATABASE_URL (direct), not PRISMA_DATABASE_URL (Accelerate) — Accelerate blocks DDL
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })

async function exec(sql: string, label: string) {
  try {
    await db.$executeRawUnsafe(sql)
    console.log(`  ✅ ${label}`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    // Ignore "already exists" errors — idempotent
    if (
      msg.includes('already exists') ||
      msg.includes('duplicate key') ||
      msg.includes('does not exist')
    ) {
      console.log(`  ⏭️  ${label} (already applied)`)
    } else {
      console.error(`  ❌ ${label}: ${msg}`)
      throw e
    }
  }
}

async function main() {
  console.log('Applying 20260316000000_add_birthday_onboarding_and_spatial_world...\n')

  // BO-1: Nation
  await exec(`ALTER TABLE "nations" DROP CONSTRAINT IF EXISTS "nations_name_key"`, 'drop nations_name_key')
  await exec(`ALTER TABLE "nations" ADD COLUMN IF NOT EXISTS "instance_id" TEXT`, 'nations.instance_id')
  await exec(`ALTER TABLE "nations" ADD CONSTRAINT "nations_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE SET NULL ON UPDATE CASCADE`, 'nations_instance_id_fkey')
  await exec(`CREATE INDEX IF NOT EXISTS "nations_instance_id_idx" ON "nations"("instance_id")`, 'nations_instance_id_idx')

  // BO-1: Archetype
  await exec(`ALTER TABLE "archetypes" DROP CONSTRAINT IF EXISTS "archetypes_name_key"`, 'drop archetypes_name_key')
  await exec(`ALTER TABLE "archetypes" ADD COLUMN IF NOT EXISTS "instance_id" TEXT`, 'archetypes.instance_id')
  await exec(`ALTER TABLE "archetypes" ADD CONSTRAINT "archetypes_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE SET NULL ON UPDATE CASCADE`, 'archetypes_instance_id_fkey')
  await exec(`CREATE INDEX IF NOT EXISTS "archetypes_instance_id_idx" ON "archetypes"("instance_id")`, 'archetypes_instance_id_idx')

  // BO-1: Instance fields
  await exec(`ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "vibe_data" TEXT`, 'instances.vibe_data')
  await exec(`ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "goal_data" TEXT`, 'instances.goal_data')
  await exec(`ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "source_instance_id" TEXT`, 'instances.source_instance_id')

  // BO-1: InstanceExportRequest
  await exec(`CREATE TABLE IF NOT EXISTS "instance_export_requests" (
    "id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "requested_by_player_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "config_bundle" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    CONSTRAINT "instance_export_requests_pkey" PRIMARY KEY ("id")
  )`, 'CREATE instance_export_requests')
  await exec(`ALTER TABLE "instance_export_requests" ADD CONSTRAINT "instance_export_requests_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE RESTRICT ON UPDATE CASCADE`, 'instance_export_requests_instance_id_fkey')
  await exec(`ALTER TABLE "instance_export_requests" ADD CONSTRAINT "instance_export_requests_requested_by_player_id_fkey" FOREIGN KEY ("requested_by_player_id") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE`, 'instance_export_requests_player_fkey')
  await exec(`CREATE INDEX IF NOT EXISTS "instance_export_requests_instance_id_idx" ON "instance_export_requests"("instance_id")`, 'instance_export_requests_idx')

  // SW-1: map_rooms slug
  await exec(`ALTER TABLE "map_rooms" ADD COLUMN IF NOT EXISTS "slug" TEXT NOT NULL DEFAULT ''`, 'map_rooms.slug')
  await exec(`CREATE UNIQUE INDEX IF NOT EXISTS "map_rooms_map_id_slug_key" ON "map_rooms"("mapId", "slug")`, 'map_rooms_map_id_slug_key')

  // SW-1: SpatialMapAnchor
  await exec(`CREATE TABLE IF NOT EXISTS "spatial_map_anchors" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "anchor_type" TEXT NOT NULL,
    "tile_x" INTEGER NOT NULL,
    "tile_y" INTEGER NOT NULL,
    "label" TEXT,
    "linked_id" TEXT,
    "linked_type" TEXT,
    "config" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "spatial_map_anchors_pkey" PRIMARY KEY ("id")
  )`, 'CREATE spatial_map_anchors')
  await exec(`ALTER TABLE "spatial_map_anchors" ADD CONSTRAINT "spatial_map_anchors_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "map_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE`, 'spatial_map_anchors_room_id_fkey')
  await exec(`CREATE INDEX IF NOT EXISTS "spatial_map_anchors_room_id_idx" ON "spatial_map_anchors"("room_id")`, 'spatial_map_anchors_room_id_idx')

  // SW-1: RoomPresence
  await exec(`CREATE TABLE IF NOT EXISTS "room_presence" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "instance_slug" TEXT NOT NULL,
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "room_presence_pkey" PRIMARY KEY ("id")
  )`, 'CREATE room_presence')
  await exec(`ALTER TABLE "room_presence" ADD CONSTRAINT "room_presence_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE`, 'room_presence_player_fkey')
  await exec(`ALTER TABLE "room_presence" ADD CONSTRAINT "room_presence_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "map_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE`, 'room_presence_room_fkey')
  await exec(`CREATE UNIQUE INDEX IF NOT EXISTS "room_presence_player_id_room_id_key" ON "room_presence"("player_id", "room_id")`, 'room_presence_unique_idx')
  await exec(`CREATE INDEX IF NOT EXISTS "room_presence_room_id_last_seen_at_idx" ON "room_presence"("room_id", "last_seen_at")`, 'room_presence_room_last_seen_idx')

  // SW-1: Player.spriteUrl
  await exec(`ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "sprite_url" TEXT`, 'players.sprite_url')

  // SW-1: Instance.spatialMapId
  await exec(`ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "spatial_map_id" TEXT`, 'instances.spatial_map_id')
  await exec(`ALTER TABLE "instances" ADD CONSTRAINT "instances_spatial_map_id_fkey" FOREIGN KEY ("spatial_map_id") REFERENCES "spatial_maps"("id") ON DELETE SET NULL ON UPDATE CASCADE`, 'instances_spatial_map_id_fkey')

  console.log('\n✅ Migration applied. Verifying...')

  const checks = await db.$queryRaw<Array<{table_name: string}>>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('spatial_map_anchors', 'room_presence', 'instance_export_requests')
  `
  console.log('New tables:', checks.map(r => r.table_name).join(', '))

  const cols = await db.$queryRaw<Array<{table_name: string, column_name: string}>>`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public'
    AND (table_name = 'players' AND column_name = 'sprite_url')
    OR (table_name = 'map_rooms' AND column_name = 'slug')
    OR (table_name = 'instances' AND column_name IN ('spatial_map_id', 'vibe_data'))
  `
  console.log('New columns:', cols.map(r => `${r.table_name}.${r.column_name}`).join(', '))

  await db.$disconnect()
}

main().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
