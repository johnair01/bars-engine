-- Book OS v1: governed manuscript sections (see .specify/specs/book-os-v1-authoring/spec.md)

CREATE TABLE "book_sections" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "parentSectionId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "sectionType" TEXT NOT NULL DEFAULT 'standard',
    "goal" TEXT,
    "teachingIntent" TEXT,
    "emotionalTarget" TEXT,
    "targetReaderState" TEXT,
    "exitReaderState" TEXT,
    "mustDefine" TEXT,
    "mustNotRepeat" TEXT,
    "dependencySectionIds" TEXT,
    "avoidanceSectionIds" TEXT,
    "draftText" TEXT,
    "approvedText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "section_sources" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "title" TEXT,
    "uri" TEXT,
    "extractedText" TEXT,
    "sourceBookId" TEXT,
    "sourceSectionId" TEXT,
    "linkedBarId" TEXT,
    "snapshotHash" TEXT,
    "tagsJson" TEXT,
    "trustLevel" TEXT NOT NULL DEFAULT 'working',
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "style_rules" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "sectionId" TEXT,
    "title" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'hard',
    "ruleText" TEXT NOT NULL,
    "exampleText" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "style_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "canon_rules" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "sectionId" TEXT,
    "title" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "ruleText" TEXT NOT NULL,
    "sourceExcerpt" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canon_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "section_runs" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "runType" TEXT NOT NULL,
    "actorType" TEXT NOT NULL DEFAULT 'human',
    "actorId" TEXT,
    "inputJson" TEXT,
    "outputText" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "section_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "approval_events" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedText" TEXT NOT NULL,
    "notes" TEXT,
    "promotedToCanon" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "section_bar_links" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "barId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "section_bar_links_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "book_sections_bookId_slug_key" ON "book_sections"("bookId", "slug");
CREATE UNIQUE INDEX "book_sections_bookId_orderIndex_key" ON "book_sections"("bookId", "orderIndex");
CREATE INDEX "book_sections_bookId_status_idx" ON "book_sections"("bookId", "status");

CREATE INDEX "section_sources_sectionId_idx" ON "section_sources"("sectionId");
CREATE INDEX "section_sources_linkedBarId_idx" ON "section_sources"("linkedBarId");
CREATE INDEX "section_sources_sourceBookId_idx" ON "section_sources"("sourceBookId");

CREATE INDEX "style_rules_bookId_idx" ON "style_rules"("bookId");
CREATE INDEX "style_rules_sectionId_idx" ON "style_rules"("sectionId");

CREATE INDEX "canon_rules_bookId_idx" ON "canon_rules"("bookId");
CREATE INDEX "canon_rules_sectionId_idx" ON "canon_rules"("sectionId");

CREATE INDEX "section_runs_sectionId_runType_idx" ON "section_runs"("sectionId", "runType");

CREATE INDEX "approval_events_sectionId_createdAt_idx" ON "approval_events"("sectionId", "createdAt");

CREATE UNIQUE INDEX "section_bar_links_sectionId_barId_role_key" ON "section_bar_links"("sectionId", "barId", "role");
CREATE INDEX "section_bar_links_sectionId_idx" ON "section_bar_links"("sectionId");
CREATE INDEX "section_bar_links_barId_idx" ON "section_bar_links"("barId");

ALTER TABLE "book_sections" ADD CONSTRAINT "book_sections_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "book_sections" ADD CONSTRAINT "book_sections_parentSectionId_fkey" FOREIGN KEY ("parentSectionId") REFERENCES "book_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "section_sources" ADD CONSTRAINT "section_sources_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "book_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "section_sources" ADD CONSTRAINT "section_sources_linkedBarId_fkey" FOREIGN KEY ("linkedBarId") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "section_sources" ADD CONSTRAINT "section_sources_sourceBookId_fkey" FOREIGN KEY ("sourceBookId") REFERENCES "books"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "section_sources" ADD CONSTRAINT "section_sources_sourceSectionId_fkey" FOREIGN KEY ("sourceSectionId") REFERENCES "book_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "style_rules" ADD CONSTRAINT "style_rules_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "style_rules" ADD CONSTRAINT "style_rules_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "book_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "canon_rules" ADD CONSTRAINT "canon_rules_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "canon_rules" ADD CONSTRAINT "canon_rules_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "book_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "section_runs" ADD CONSTRAINT "section_runs_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "book_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "approval_events" ADD CONSTRAINT "approval_events_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "book_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "approval_events" ADD CONSTRAINT "approval_events_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "section_bar_links" ADD CONSTRAINT "section_bar_links_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "book_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "section_bar_links" ADD CONSTRAINT "section_bar_links_barId_fkey" FOREIGN KEY ("barId") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
