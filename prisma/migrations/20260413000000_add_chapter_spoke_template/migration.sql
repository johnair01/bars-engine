-- Chapter-Spoke Template: three new tables (spec 1.41)
-- ChapterRegistration, PlayerChapterProgress, ChapterMilestone

-- CreateTable: chapter_registrations
CREATE TABLE "chapter_registrations" (
    "id"           TEXT NOT NULL,
    "chapterRef"   TEXT NOT NULL,
    "bookRef"      TEXT NOT NULL,
    "orgRef"       TEXT NOT NULL,
    "version"      TEXT NOT NULL DEFAULT 'v1',
    "definition"   JSONB NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapter_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chapter_registrations_chapterRef_key" ON "chapter_registrations"("chapterRef");
CREATE INDEX "chapter_registrations_bookRef_idx" ON "chapter_registrations"("bookRef");
CREATE INDEX "chapter_registrations_orgRef_idx" ON "chapter_registrations"("orgRef");

-- CreateTable: player_chapter_progress
CREATE TABLE "player_chapter_progress" (
    "id"             TEXT NOT NULL,
    "playerId"       TEXT NOT NULL,
    "chapterRef"     TEXT NOT NULL,
    "firstEnteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEnteredAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enterCount"     INTEGER NOT NULL DEFAULT 1,
    "barCount"       INTEGER NOT NULL DEFAULT 0,
    "completed"      BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "player_chapter_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "player_chapter_progress_playerId_chapterRef_key" ON "player_chapter_progress"("playerId", "chapterRef");
CREATE INDEX "player_chapter_progress_playerId_idx" ON "player_chapter_progress"("playerId");
CREATE INDEX "player_chapter_progress_chapterRef_idx" ON "player_chapter_progress"("chapterRef");

ALTER TABLE "player_chapter_progress"
    ADD CONSTRAINT "player_chapter_progress_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: chapter_milestones
CREATE TABLE "chapter_milestones" (
    "id"                 TEXT NOT NULL,
    "chapterRef"         TEXT NOT NULL,
    "bookRef"            TEXT NOT NULL,
    "title"              TEXT NOT NULL,
    "description"        TEXT NOT NULL,
    "parentMilestoneRef" TEXT,
    "rollupWeight"       DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "minBarsRequired"    INTEGER NOT NULL DEFAULT 1,
    "totalBarCount"      INTEGER NOT NULL DEFAULT 0,
    "totalPlayerCount"   INTEGER NOT NULL DEFAULT 0,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapter_milestones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chapter_milestones_chapterRef_key" ON "chapter_milestones"("chapterRef");
CREATE INDEX "chapter_milestones_bookRef_idx" ON "chapter_milestones"("bookRef");
