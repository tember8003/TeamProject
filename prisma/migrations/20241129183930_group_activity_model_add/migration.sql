/*
  Warnings:

  - You are about to drop the column `userType` on the `User` table. All the data in the column will be lost.
  - Added the required column `Contact` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `GroupRoom` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `GroupTime` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "Contact" TEXT NOT NULL,
ADD COLUMN     "GroupRoom" TEXT NOT NULL,
ADD COLUMN     "GroupTime" TEXT NOT NULL,
ADD COLUMN     "period" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "userType";

-- CreateTable
CREATE TABLE "GroupActivity" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" INTEGER NOT NULL,
    "images" TEXT[],
    "type" TEXT NOT NULL,

    CONSTRAINT "GroupActivity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GroupActivity" ADD CONSTRAINT "GroupActivity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
