CREATE TABLE "family_decision_rooms" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "financialSnapshotVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "family_decision_rooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "family_room_access_attempts" (
    "id" TEXT NOT NULL,
    "identityHash" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "family_room_access_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "family_participants" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "family_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "family_funding_decisions" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "fundingOption" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "durationDays" INTEGER,
    "terms" TEXT,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "family_funding_decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "volunteer_cfo_agreements" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "spendingApprovalThresholdCents" INTEGER NOT NULL DEFAULT 10000,
    "adScalingApproval" BOOLEAN NOT NULL DEFAULT true,
    "pauseRevisionRight" BOOLEAN NOT NULL DEFAULT true,
    "negotiationRight" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReview" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "volunteer_cfo_agreements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "budget_line_questions" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "budgetSnapshotVersion" TEXT NOT NULL,
    "lineItemKey" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "budget_line_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "budget_line_answers" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "budget_line_answers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "family_reflections" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "chargeDescription" TEXT,
    "maskShape" TEXT,
    "maskName" TEXT,
    "desire" TEXT,
    "desireOutcome" TEXT,
    "lifeState" TEXT,
    "rootCause" TEXT,
    "fear" TEXT,
    "somaticEcho" TEXT,
    "interiorVoice" TEXT,
    "integrationShift" TEXT,
    "alignedAction" TEXT,
    "publishedSynthesis" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "family_reflections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "budget_scenarios" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "name" TEXT,
    "snapshotVersion" TEXT NOT NULL,
    "assumptionOverridesJson" TEXT NOT NULL,
    "calculatedTotalsJson" TEXT NOT NULL,
    "sharedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "budget_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "weekly_reviews" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "snapshotVersion" TEXT NOT NULL,
    "jobApplications" INTEGER NOT NULL DEFAULT 0,
    "marketingActions" INTEGER NOT NULL DEFAULT 0,
    "revenueCents" INTEGER NOT NULL DEFAULT 0,
    "spendingCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "decisions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "weekly_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "family_altitude_commitments" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "altitude" TEXT NOT NULL,
    "handoffNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "family_altitude_commitments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "family_decision_rooms_slug_key" ON "family_decision_rooms"("slug");
CREATE UNIQUE INDEX "family_room_access_attempts_identityHash_key" ON "family_room_access_attempts"("identityHash");
CREATE UNIQUE INDEX "family_participants_tokenHash_key" ON "family_participants"("tokenHash");
CREATE INDEX "family_participants_roomId_idx" ON "family_participants"("roomId");
CREATE INDEX "family_funding_decisions_roomId_updatedAt_idx" ON "family_funding_decisions"("roomId", "updatedAt");
CREATE UNIQUE INDEX "volunteer_cfo_agreements_roomId_participantId_key" ON "volunteer_cfo_agreements"("roomId", "participantId");
CREATE INDEX "budget_line_questions_roomId_lineItemKey_createdAt_idx" ON "budget_line_questions"("roomId", "lineItemKey", "createdAt");
CREATE INDEX "budget_line_answers_questionId_createdAt_idx" ON "budget_line_answers"("questionId", "createdAt");
CREATE UNIQUE INDEX "family_reflections_roomId_participantId_key" ON "family_reflections"("roomId", "participantId");
CREATE INDEX "family_reflections_roomId_publishedAt_idx" ON "family_reflections"("roomId", "publishedAt");
CREATE INDEX "budget_scenarios_roomId_createdAt_idx" ON "budget_scenarios"("roomId", "createdAt");
CREATE UNIQUE INDEX "weekly_reviews_roomId_weekOf_key" ON "weekly_reviews"("roomId", "weekOf");
CREATE INDEX "weekly_reviews_roomId_updatedAt_idx" ON "weekly_reviews"("roomId", "updatedAt");
CREATE UNIQUE INDEX "family_altitude_commitments_roomId_participantId_key" ON "family_altitude_commitments"("roomId", "participantId");

ALTER TABLE "family_participants" ADD CONSTRAINT "family_participants_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "family_decision_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_funding_decisions" ADD CONSTRAINT "family_funding_decisions_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "family_decision_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_funding_decisions" ADD CONSTRAINT "family_funding_decisions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "family_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_cfo_agreements" ADD CONSTRAINT "volunteer_cfo_agreements_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "family_decision_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_cfo_agreements" ADD CONSTRAINT "volunteer_cfo_agreements_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "family_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budget_line_questions" ADD CONSTRAINT "budget_line_questions_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "family_decision_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budget_line_questions" ADD CONSTRAINT "budget_line_questions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "family_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budget_line_answers" ADD CONSTRAINT "budget_line_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "budget_line_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budget_line_answers" ADD CONSTRAINT "budget_line_answers_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "family_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_reflections" ADD CONSTRAINT "family_reflections_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "family_decision_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_reflections" ADD CONSTRAINT "family_reflections_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "family_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budget_scenarios" ADD CONSTRAINT "budget_scenarios_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "family_decision_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budget_scenarios" ADD CONSTRAINT "budget_scenarios_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "family_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "family_decision_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "family_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_altitude_commitments" ADD CONSTRAINT "family_altitude_commitments_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "family_decision_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_altitude_commitments" ADD CONSTRAINT "family_altitude_commitments_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "family_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
