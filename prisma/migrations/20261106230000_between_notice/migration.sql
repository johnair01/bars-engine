-- CreateTable
CREATE TABLE "between_notices" (
    "garden_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "between_notices_pkey" PRIMARY KEY ("garden_id","player_id","day")
);

-- AddForeignKey
ALTER TABLE "between_notices" ADD CONSTRAINT "between_notices_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "between_gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;
