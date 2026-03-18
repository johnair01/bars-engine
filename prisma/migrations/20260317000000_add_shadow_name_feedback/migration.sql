-- CreateTable
CREATE TABLE "shadow_name_feedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inputHash" TEXT NOT NULL,
    "suggestedName" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "editedTo" TEXT,

    CONSTRAINT "shadow_name_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shadow_name_feedback_inputHash_idx" ON "shadow_name_feedback"("inputHash");

-- CreateIndex
CREATE INDEX "shadow_name_feedback_accepted_idx" ON "shadow_name_feedback"("accepted");
