-- Founder support demo (hole H-packet-store): one seed packet per player id, readable by a game master.
CREATE TABLE "founder_packets" (
    "player_id" TEXT NOT NULL,
    "packet_json" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "founder_packets_pkey" PRIMARY KEY ("player_id")
);
CREATE INDEX "founder_packets_updated_at_idx" ON "founder_packets"("updated_at");
