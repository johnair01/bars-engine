-- ============================================================
-- Birthday Onboarding (BO-1) + Spatial World (SW-1) migration
-- ============================================================

-- BO-1: Add instanceId to Nation (drop @unique on name first)
ALTER TABLE "nations" DROP CONSTRAINT IF EXISTS "nations_name_key";
ALTER TABLE "nations" ADD COLUMN IF NOT EXISTS "instance_id" TEXT;
ALTER TABLE "nations" ADD CONSTRAINT "nations_instance_id_fkey"
  FOREIGN KEY ("instance_id") REFERENCES "instances"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "nations_instance_id_idx" ON "nations"("instance_id");

-- BO-1: Add instanceId to Archetype (drop @unique on name first)
ALTER TABLE "archetypes" DROP CONSTRAINT IF EXISTS "archetypes_name_key";
ALTER TABLE "archetypes" ADD COLUMN IF NOT EXISTS "instance_id" TEXT;
ALTER TABLE "archetypes" ADD CONSTRAINT "archetypes_instance_id_fkey"
  FOREIGN KEY ("instance_id") REFERENCES "instances"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "archetypes_instance_id_idx" ON "archetypes"("instance_id");

-- BO-1: Add fields to Instance
ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "vibe_data" TEXT;
ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "goal_data" TEXT;
ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "source_instance_id" TEXT;

-- BO-1: Add InstanceExportRequest model
CREATE TABLE IF NOT EXISTS "instance_export_requests" (
    "id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "requested_by_player_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "config_bundle" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "instance_export_requests_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "instance_export_requests" ADD CONSTRAINT "instance_export_requests_instance_id_fkey"
  FOREIGN KEY ("instance_id") REFERENCES "instances"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "instance_export_requests" ADD CONSTRAINT "instance_export_requests_requested_by_player_id_fkey"
  FOREIGN KEY ("requested_by_player_id") REFERENCES "players"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "instance_export_requests_instance_id_idx" ON "instance_export_requests"("instance_id");

-- SW-1: Add slug to map_rooms
ALTER TABLE "map_rooms" ADD COLUMN IF NOT EXISTS "slug" TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS "map_rooms_map_id_slug_key" ON "map_rooms"("mapId", "slug");

-- SW-1: Add SpatialMapAnchor model
CREATE TABLE IF NOT EXISTS "spatial_map_anchors" (
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
);
ALTER TABLE "spatial_map_anchors" ADD CONSTRAINT "spatial_map_anchors_room_id_fkey"
  FOREIGN KEY ("room_id") REFERENCES "map_rooms"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "spatial_map_anchors_room_id_idx" ON "spatial_map_anchors"("room_id");

-- SW-1: Add RoomPresence model
CREATE TABLE IF NOT EXISTS "room_presence" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "instance_slug" TEXT NOT NULL,
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_presence_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "room_presence" ADD CONSTRAINT "room_presence_player_id_fkey"
  FOREIGN KEY ("player_id") REFERENCES "players"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "room_presence" ADD CONSTRAINT "room_presence_room_id_fkey"
  FOREIGN KEY ("room_id") REFERENCES "map_rooms"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS "room_presence_player_id_room_id_key" ON "room_presence"("player_id", "room_id");
CREATE INDEX IF NOT EXISTS "room_presence_room_id_last_seen_at_idx" ON "room_presence"("room_id", "last_seen_at");

-- SW-1: Add spriteUrl to Player
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "sprite_url" TEXT;

-- SW-1: Add spatialMapId to Instance
ALTER TABLE "instances" ADD COLUMN IF NOT EXISTS "spatial_map_id" TEXT;
ALTER TABLE "instances" ADD CONSTRAINT "instances_spatial_map_id_fkey"
  FOREIGN KEY ("spatial_map_id") REFERENCES "spatial_maps"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
