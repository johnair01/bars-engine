-- World-kit publish path (spec wa-world-kit). Two new tables, nothing else touched.

-- CreateTable
CREATE TABLE "world_kits" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "kit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "files" JSONB NOT NULL,
    "portraits" JSONB NOT NULL DEFAULT '[]',
    "findings" JSONB NOT NULL DEFAULT '[]',
    "visibility" TEXT NOT NULL DEFAULT 'author',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "world_kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_kit_attempts" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "kit_id" TEXT,
    "verdict" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "findings" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "world_kit_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "world_kits_player_id_kit_id_key" ON "world_kits"("player_id", "kit_id");

-- CreateIndex
CREATE INDEX "world_kit_attempts_player_id_created_at_idx" ON "world_kit_attempts"("player_id", "created_at");
