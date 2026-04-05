-- CreateTable
CREATE TABLE "book_chunk_tags" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "charStart" INTEGER NOT NULL,
    "charEnd" INTEGER NOT NULL,
    "gameMasterFace" TEXT NOT NULL,
    "hexagramId" INTEGER,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_chunk_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "book_chunk_tags_bookId_charStart_charEnd_key" ON "book_chunk_tags"("bookId", "charStart", "charEnd");

-- CreateIndex
CREATE INDEX "book_chunk_tags_bookId_idx" ON "book_chunk_tags"("bookId");

-- CreateIndex
CREATE INDEX "book_chunk_tags_bookId_gameMasterFace_idx" ON "book_chunk_tags"("bookId", "gameMasterFace");

-- AddForeignKey
ALTER TABLE "book_chunk_tags" ADD CONSTRAINT "book_chunk_tags_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
