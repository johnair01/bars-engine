-- AlterTable — aligns DB with prisma/schema.prisma Player.gmFaceLevel (was missing from migration history)
ALTER TABLE "players" ADD COLUMN "gmFaceLevel" INTEGER NOT NULL DEFAULT 1;
