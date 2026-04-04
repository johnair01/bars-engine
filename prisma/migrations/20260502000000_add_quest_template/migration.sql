-- CreateTable: QuestTemplate — reusable quest blueprints for Campaign Self-Serve L1 wizard
CREATE TABLE "quest_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "defaultSettings" JSONB NOT NULL DEFAULT '{}',
    "copyTemplate" JSONB NOT NULL DEFAULT '{}',
    "narrativeHooks" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quest_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quest_templates_key_key" ON "quest_templates"("key");

-- CreateIndex
CREATE INDEX "quest_templates_category_status_idx" ON "quest_templates"("category", "status");
