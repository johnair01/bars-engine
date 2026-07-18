CREATE TABLE "book_tour_help_interests" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "location" TEXT,
  "helpTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "note" TEXT,
  "consent" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT NOT NULL DEFAULT 'webinar-book-tour-help',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "book_tour_help_interests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "book_tour_help_interests_createdAt_idx" ON "book_tour_help_interests"("createdAt");
CREATE INDEX "book_tour_help_interests_email_idx" ON "book_tour_help_interests"("email");
