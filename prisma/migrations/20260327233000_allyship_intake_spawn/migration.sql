-- ECI Phase B: link watered intakes to spawned child Instance
ALTER TABLE "latent_allyship_intakes" ADD COLUMN "spawned_instance_id" TEXT,
ADD COLUMN "watered_at" TIMESTAMP(3),
ADD COLUMN "watered_by_player_id" TEXT,
ADD COLUMN "steward_notes" TEXT;

CREATE INDEX "latent_allyship_intakes_spawned_instance_id_idx" ON "latent_allyship_intakes"("spawned_instance_id");

ALTER TABLE "latent_allyship_intakes" ADD CONSTRAINT "latent_allyship_intakes_spawned_instance_id_fkey" FOREIGN KEY ("spawned_instance_id") REFERENCES "instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "latent_allyship_intakes" ADD CONSTRAINT "latent_allyship_intakes_watered_by_player_id_fkey" FOREIGN KEY ("watered_by_player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
