-- CreateTable
CREATE TABLE "micro_twine_modules" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "canonicalJson" TEXT NOT NULL,
    "tweeSource" TEXT NOT NULL,
    "htmlArtifact" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "micro_twine_modules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "micro_twine_modules_questId_key" ON "micro_twine_modules"("questId");

-- AddForeignKey
ALTER TABLE "micro_twine_modules" ADD CONSTRAINT "micro_twine_modules_questId_fkey" FOREIGN KEY ("questId") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
