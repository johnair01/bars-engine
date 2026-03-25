-- CreateTable
CREATE TABLE "swap_event_rsvps" (
    "id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "partiful_ref" TEXT,
    "external_ref" TEXT,
    "skip_full_onboarding" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "swap_event_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "swap_event_rsvps_instance_id_created_at_idx" ON "swap_event_rsvps"("instance_id", "created_at");

-- AddForeignKey
ALTER TABLE "swap_event_rsvps" ADD CONSTRAINT "swap_event_rsvps_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
