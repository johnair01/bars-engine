-- Dojo entry, practice seeds and BAR links (spec dojo-entry-practice-seeds). Two new tables, nothing else touched.

-- CreateTable
CREATE TABLE "dojo_practices" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "bar_id" TEXT,
    "planted_bar_id" TEXT,
    "title" TEXT,
    "intention" TEXT,
    "platform" JSONB NOT NULL DEFAULT '[]',
    "spirit_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "constellation" JSONB NOT NULL,
    "outcomes" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dojo_practices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dojo_embers" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "source_kind" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "element" TEXT,
    "intensity" INTEGER NOT NULL DEFAULT 1,
    "selected_ingredients" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'held',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dojo_embers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dojo_practices_player_id_status_idx" ON "dojo_practices"("player_id", "status");

-- CreateIndex
CREATE INDEX "dojo_practices_player_id_bar_id_idx" ON "dojo_practices"("player_id", "bar_id");

-- CreateIndex
CREATE INDEX "dojo_embers_player_id_status_idx" ON "dojo_embers"("player_id", "status");
