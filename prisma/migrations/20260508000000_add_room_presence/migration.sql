-- CreateTable: room_presences
CREATE TABLE "room_presences" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "instance_slug" TEXT NOT NULL,
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_presences_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "room_presences" ADD CONSTRAINT "room_presences_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_presences" ADD CONSTRAINT "room_presences_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "map_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
