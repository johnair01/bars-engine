-- CreateEnum: NarrativeTemplateKind
CREATE TYPE "NarrativeTemplateKind" AS ENUM ('EPIPHANY', 'KOTTER', 'ORIENTATION', 'CUSTOM');

-- CreateTable: narrative_templates
-- Unified narrative template registry with shared spine + kind-specific JSON configBlob.
CREATE TABLE "narrative_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "NarrativeTemplateKind" NOT NULL,
    "stepCount" INTEGER NOT NULL,
    "faceAffinities" JSONB NOT NULL DEFAULT '[]',
    "questModel" TEXT NOT NULL DEFAULT 'personal',
    "configBlob" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "narrative_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "narrative_templates_key_key" ON "narrative_templates"("key");

-- CreateIndex
CREATE INDEX "narrative_templates_kind_status_idx" ON "narrative_templates"("kind", "status");
