-- CreateTable: alchemy_scene_templates
-- These tables reached deployed databases through `prisma db push`, so no migration
-- created them; the chain stopped on a fresh database at the first statement that
-- referenced each one. Columns added by later migrations are left to those migrations.

CREATE TABLE IF NOT EXISTS "alchemy_scene_templates" (
    "id" TEXT NOT NULL,
    "sceneType" TEXT NOT NULL DEFAULT 'transcend',
    "channel" TEXT NOT NULL,
    "altitudeFrom" TEXT NOT NULL,
    "altitudeTo" TEXT NOT NULL,
    "targetChannel" TEXT,
    "title" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "friction" TEXT NOT NULL,
    "invitation" TEXT NOT NULL,
    "choices" TEXT NOT NULL,
    "advice" TEXT,
    "archetypeBias" TEXT,
    "nationBias" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "alchemy_scene_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "alchemy_scene_templates_channel_altitudeFrom_sceneType_idx" ON "alchemy_scene_templates"("channel", "altitudeFrom", "sceneType");
