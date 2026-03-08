-- CreateTable
CREATE TABLE "compiled_twee_versions" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "tweeContent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "compiled_twee_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compiled_twee_versions_storyId_createdAt_idx" ON "compiled_twee_versions"("storyId", "createdAt");

-- AddForeignKey
ALTER TABLE "compiled_twee_versions" ADD CONSTRAINT "compiled_twee_versions_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "twine_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
