-- CreateTable: archetypes, map_rooms, spatial_maps
-- These tables reached deployed databases through `prisma db push`, so no migration
-- created them; the chain stopped on a fresh database at the first statement that
-- referenced each one. Columns added by later migrations are left to those migrations.

CREATE TABLE IF NOT EXISTS "archetypes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "moves" TEXT NOT NULL,
    "content" TEXT,
    "centralConflict" TEXT,
    "primaryQuestion" TEXT,
    "vibe" TEXT,
    "energy" TEXT,
    "shadowSignposts" TEXT,
    "lightSignposts" TEXT,
    "examples" TEXT,
    "wakeUp" TEXT,
    "cleanUp" TEXT,
    "growUp" TEXT,
    "showUp" TEXT,
    "primaryWaveStage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emotionalFirstAid" TEXT,
    "instanceId" TEXT,

    CONSTRAINT "archetypes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "archetypes_instanceId_idx" ON "archetypes"("instanceId");

CREATE TABLE IF NOT EXISTS "map_rooms" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tilemap" TEXT NOT NULL,
    "graphNodeId" TEXT,
    "channelId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "roomType" TEXT,
    "nationKey" TEXT,
    "backgroundUrl" TEXT,

    CONSTRAINT "map_rooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "spatial_maps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instance_id" TEXT,
    "map_type" TEXT NOT NULL,
    "spawnpoint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spatial_maps_pkey" PRIMARY KEY ("id")
);
