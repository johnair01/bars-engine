-- CreateTable
CREATE TABLE "spec_kit_backlog_items" (
    "id" TEXT NOT NULL,
    "priority" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "featureName" TEXT NOT NULL,
    "link" TEXT,
    "category" TEXT NOT NULL DEFAULT 'UI',
    "status" TEXT NOT NULL DEFAULT 'Ready',
    "dependencies" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spec_kit_backlog_items_pkey" PRIMARY KEY ("id")
);
