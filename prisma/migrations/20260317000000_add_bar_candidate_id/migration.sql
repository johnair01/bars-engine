-- Add barCandidateId to custom_bars (source ingestion pipeline)
-- Creates source_documents → source_excerpts → bar_candidates chain + extension_prompts, quest_seeds

-- CreateTable source_documents
CREATE TABLE IF NOT EXISTS "source_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'PDF',
    "fileUrl" TEXT,
    "uploadedByUserId" TEXT NOT NULL,
    "documentKind" TEXT NOT NULL DEFAULT 'NONFICTION',
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "pageCount" INTEGER,
    "bookId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "source_documents_bookId_key" ON "source_documents"("bookId");
CREATE INDEX IF NOT EXISTS "source_documents_uploadedByUserId_idx" ON "source_documents"("uploadedByUserId");
CREATE INDEX IF NOT EXISTS "source_documents_status_idx" ON "source_documents"("status");

-- CreateTable source_excerpts
CREATE TABLE IF NOT EXISTS "source_excerpts" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "excerptIndex" INTEGER NOT NULL,
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "chapterTitle" TEXT,
    "sectionTitle" TEXT,
    "charStart" INTEGER,
    "charEnd" INTEGER,
    "analysisStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_excerpts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "source_excerpts_sourceDocumentId_idx" ON "source_excerpts"("sourceDocumentId");

-- CreateTable bar_candidates
CREATE TABLE IF NOT EXISTS "bar_candidates" (
    "id" TEXT NOT NULL,
    "sourceExcerptId" TEXT NOT NULL,
    "candidateType" TEXT NOT NULL,
    "titleDraft" TEXT NOT NULL,
    "bodyDraft" TEXT NOT NULL,
    "metabolizabilityTier" TEXT NOT NULL,
    "chargeScore" DOUBLE PRECISION,
    "actionabilityScore" DOUBLE PRECISION,
    "extendabilityScore" DOUBLE PRECISION,
    "replayabilityScore" DOUBLE PRECISION,
    "shareabilityScore" DOUBLE PRECISION,
    "provenanceValueScore" DOUBLE PRECISION,
    "recommendedDisposition" TEXT NOT NULL,
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bar_candidates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "bar_candidates_sourceExcerptId_idx" ON "bar_candidates"("sourceExcerptId");
CREATE INDEX IF NOT EXISTS "bar_candidates_reviewStatus_idx" ON "bar_candidates"("reviewStatus");

-- CreateTable extension_prompts
CREATE TABLE IF NOT EXISTS "extension_prompts" (
    "id" TEXT NOT NULL,
    "sourceExcerptId" TEXT,
    "barCandidateId" TEXT,
    "promptTitle" TEXT NOT NULL,
    "promptBody" TEXT NOT NULL,
    "promptType" TEXT NOT NULL DEFAULT 'PLAYER_BAR_EXTENSION',
    "createdByUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extension_prompts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "extension_prompts_barCandidateId_idx" ON "extension_prompts"("barCandidateId");
CREATE INDEX IF NOT EXISTS "extension_prompts_sourceExcerptId_idx" ON "extension_prompts"("sourceExcerptId");

-- CreateTable quest_seeds
CREATE TABLE IF NOT EXISTS "quest_seeds" (
    "id" TEXT NOT NULL,
    "sourceExcerptId" TEXT,
    "barCandidateId" TEXT,
    "extensionPromptId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "questType" TEXT,
    "archetypeTags" TEXT NOT NULL DEFAULT '[]',
    "nationTags" TEXT NOT NULL DEFAULT '[]',
    "domainTags" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quest_seeds_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "quest_seeds_barCandidateId_idx" ON "quest_seeds"("barCandidateId");
CREATE INDEX IF NOT EXISTS "quest_seeds_sourceExcerptId_idx" ON "quest_seeds"("sourceExcerptId");

-- Add FKs for new tables (only if tables were just created; use IF NOT EXISTS pattern via DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'source_excerpts_sourceDocumentId_fkey') THEN
    ALTER TABLE "source_excerpts" ADD CONSTRAINT "source_excerpts_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "source_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'source_documents_uploadedByUserId_fkey') THEN
    ALTER TABLE "source_documents" ADD CONSTRAINT "source_documents_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bar_candidates_sourceExcerptId_fkey') THEN
    ALTER TABLE "bar_candidates" ADD CONSTRAINT "bar_candidates_sourceExcerptId_fkey" FOREIGN KEY ("sourceExcerptId") REFERENCES "source_excerpts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'extension_prompts_barCandidateId_fkey') THEN
    ALTER TABLE "extension_prompts" ADD CONSTRAINT "extension_prompts_barCandidateId_fkey" FOREIGN KEY ("barCandidateId") REFERENCES "bar_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quest_seeds_barCandidateId_fkey') THEN
    ALTER TABLE "quest_seeds" ADD CONSTRAINT "quest_seeds_barCandidateId_fkey" FOREIGN KEY ("barCandidateId") REFERENCES "bar_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Add barCandidateId to custom_bars
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'custom_bars' AND column_name = 'barCandidateId') THEN
    ALTER TABLE "custom_bars" ADD COLUMN "barCandidateId" TEXT;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "custom_bars_barCandidateId_key" ON "custom_bars"("barCandidateId");
ALTER TABLE "custom_bars" DROP CONSTRAINT IF EXISTS "custom_bars_barCandidateId_fkey";
ALTER TABLE "custom_bars" ADD CONSTRAINT "custom_bars_barCandidateId_fkey" FOREIGN KEY ("barCandidateId") REFERENCES "bar_candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
