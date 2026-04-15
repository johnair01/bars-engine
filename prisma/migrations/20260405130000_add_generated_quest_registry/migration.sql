-- CreateTable
CREATE TABLE "generated_quest_registry" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "moveType" TEXT NOT NULL,
    "bookId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_quest_registry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generated_quest_registry_bookId_idx" ON "generated_quest_registry"("bookId");

-- CreateIndex
CREATE INDEX "generated_quest_registry_status_idx" ON "generated_quest_registry"("status");

-- AddForeignKey
ALTER TABLE "generated_quest_registry" ADD CONSTRAINT "generated_quest_registry_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE SET NULL ON UPDATE CASCADE;
