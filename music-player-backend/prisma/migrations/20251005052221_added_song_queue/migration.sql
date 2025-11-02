/*
  Warnings:

  - You are about to drop the column `songUrl` on the `Room` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Room" DROP COLUMN "songUrl";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "currentRoomId" INTEGER NOT NULL DEFAULT -1,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."SongQueue" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "ytVideoId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongQueue_pkey" PRIMARY KEY ("id")
);
