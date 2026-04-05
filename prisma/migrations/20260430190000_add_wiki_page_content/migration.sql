-- CreateTable
CREATE TABLE "wiki_page_contents" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bodyMarkdown" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wiki_page_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wiki_page_contents_slug_key" ON "wiki_page_contents"("slug");

-- CreateIndex
CREATE INDEX "wiki_page_contents_status_idx" ON "wiki_page_contents"("status");
