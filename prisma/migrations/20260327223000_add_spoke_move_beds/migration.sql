-- SMB: spoke move seed beds (anchor + campaign_kernel plants per spoke × move)

CREATE TABLE "spoke_move_beds" (
    "id" TEXT NOT NULL,
    "campaign_ref" TEXT NOT NULL,
    "spoke_index" INTEGER NOT NULL,
    "move_type" TEXT NOT NULL,
    "anchor_bar_id" TEXT,
    "anchored_by_player_id" TEXT,
    "anchored_at" TIMESTAMP(3),
    "anchor_reassigned_by_id" TEXT,
    "anchor_reassigned_at" TIMESTAMP(3),
    "anchor_reassign_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spoke_move_beds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "spoke_move_beds_anchor_bar_id_key" ON "spoke_move_beds"("anchor_bar_id");

CREATE INDEX "spoke_move_beds_campaign_ref_spoke_index_idx" ON "spoke_move_beds"("campaign_ref", "spoke_index");

CREATE UNIQUE INDEX "spoke_move_beds_campaign_ref_spoke_index_move_type_key" ON "spoke_move_beds"("campaign_ref", "spoke_index", "move_type");

CREATE TABLE "spoke_move_bed_kernels" (
    "id" TEXT NOT NULL,
    "bed_id" TEXT NOT NULL,
    "kernel_bar_id" TEXT NOT NULL,
    "planted_by_id" TEXT NOT NULL,
    "source_bar_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spoke_move_bed_kernels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "spoke_move_bed_kernels_kernel_bar_id_key" ON "spoke_move_bed_kernels"("kernel_bar_id");

CREATE INDEX "spoke_move_bed_kernels_bed_id_idx" ON "spoke_move_bed_kernels"("bed_id");

ALTER TABLE "spoke_move_beds" ADD CONSTRAINT "spoke_move_beds_anchor_bar_id_fkey" FOREIGN KEY ("anchor_bar_id") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "spoke_move_beds" ADD CONSTRAINT "spoke_move_beds_anchored_by_player_id_fkey" FOREIGN KEY ("anchored_by_player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "spoke_move_bed_kernels" ADD CONSTRAINT "spoke_move_bed_kernels_bed_id_fkey" FOREIGN KEY ("bed_id") REFERENCES "spoke_move_beds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "spoke_move_bed_kernels" ADD CONSTRAINT "spoke_move_bed_kernels_kernel_bar_id_fkey" FOREIGN KEY ("kernel_bar_id") REFERENCES "custom_bars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "spoke_move_bed_kernels" ADD CONSTRAINT "spoke_move_bed_kernels_planted_by_id_fkey" FOREIGN KEY ("planted_by_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "spoke_move_bed_kernels" ADD CONSTRAINT "spoke_move_bed_kernels_source_bar_id_fkey" FOREIGN KEY ("source_bar_id") REFERENCES "custom_bars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
