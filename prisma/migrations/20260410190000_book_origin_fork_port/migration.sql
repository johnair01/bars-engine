-- Book origin / fork lineage (book-origin-fork-port spec)
ALTER TABLE "books" ADD COLUMN "bookOrigin" TEXT NOT NULL DEFAULT 'library_ingested';
ALTER TABLE "books" ADD COLUMN "parentBookId" TEXT;
ALTER TABLE "books" ADD COLUMN "forkedAt" TIMESTAMP(3);
ALTER TABLE "books" ADD COLUMN "forkMetadataJson" TEXT;

CREATE INDEX "books_parentBookId_idx" ON "books"("parentBookId");

ALTER TABLE "books" ADD CONSTRAINT "books_parentBookId_fkey" FOREIGN KEY ("parentBookId") REFERENCES "books"("id") ON DELETE SET NULL ON UPDATE CASCADE;
