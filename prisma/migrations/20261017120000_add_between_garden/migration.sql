-- The Between on bars-engine (six-faces-council bh-move-to-bars-engine, 2026-10-17): the relationship garden two
-- people tend, moved off the claude.ai artifact store. Eight new tables, nothing else touched.

-- CreateTable
CREATE TABLE "between_gardens" (
    "id" TEXT NOT NULL,
    "started_by_id" TEXT NOT NULL,
    "invite_token" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "between_gardens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "between_members" (
    "garden_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "between_members_pkey" PRIMARY KEY ("garden_id","player_id")
);

-- CreateTable
CREATE TABLE "between_items" (
    "garden_id" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "by_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "between_items_pkey" PRIMARY KEY ("garden_id","id")
);

-- CreateTable
CREATE TABLE "between_spirits" (
    "garden_id" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "between_spirits_pkey" PRIMARY KEY ("garden_id","id")
);

-- CreateTable
CREATE TABLE "between_daemons" (
    "garden_id" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "between_daemons_pkey" PRIMARY KEY ("garden_id","id")
);

-- CreateTable
CREATE TABLE "between_shown" (
    "garden_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "between_shown_pkey" PRIMARY KEY ("garden_id","player_id")
);

-- CreateTable
CREATE TABLE "between_privates" (
    "garden_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "between_privates_pkey" PRIMARY KEY ("garden_id","player_id","key")
);

-- CreateTable
CREATE TABLE "between_presence" (
    "garden_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "between_presence_pkey" PRIMARY KEY ("garden_id","player_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "between_gardens_invite_token_key" ON "between_gardens"("invite_token");

-- CreateIndex
CREATE INDEX "between_gardens_started_by_id_idx" ON "between_gardens"("started_by_id");

-- CreateIndex
CREATE INDEX "between_members_player_id_idx" ON "between_members"("player_id");

-- AddForeignKey
ALTER TABLE "between_members" ADD CONSTRAINT "between_members_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "between_gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "between_items" ADD CONSTRAINT "between_items_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "between_gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "between_spirits" ADD CONSTRAINT "between_spirits_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "between_gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "between_daemons" ADD CONSTRAINT "between_daemons_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "between_gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "between_shown" ADD CONSTRAINT "between_shown_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "between_gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "between_privates" ADD CONSTRAINT "between_privates_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "between_gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "between_presence" ADD CONSTRAINT "between_presence_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "between_gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

