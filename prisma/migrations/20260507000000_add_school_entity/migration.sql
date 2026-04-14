-- CreateTable: schools
-- School entity: 6 Big Schools (nationId=NULL, one per GameMasterFace)
-- plus 30 nation gyms (5 nations × 6 faces, nationId set).
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "portraysFace" TEXT NOT NULL,
    "nationId" TEXT,
    "instanceId" TEXT,
    "imgUrl" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schools_portraysFace_idx" ON "schools"("portraysFace");

-- CreateIndex
CREATE INDEX "schools_nationId_idx" ON "schools"("nationId");

-- CreateIndex
CREATE INDEX "schools_instanceId_idx" ON "schools"("instanceId");

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "nations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
