-- AlterTable: add intakeCheckInId to spoke_sessions
ALTER TABLE "spoke_sessions" ADD COLUMN "intakeCheckInId" TEXT;

-- CreateIndex
CREATE INDEX "spoke_sessions_intakeCheckInId_idx" ON "spoke_sessions"("intakeCheckInId");

-- AddForeignKey
ALTER TABLE "spoke_sessions" ADD CONSTRAINT "spoke_sessions_intakeCheckInId_fkey" FOREIGN KEY ("intakeCheckInId") REFERENCES "alchemy_check_ins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
