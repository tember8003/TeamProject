/*
  Warnings:

  - You are about to drop the column `ActiceLog` on the `Group` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Group" DROP COLUMN "ActiceLog",
ADD COLUMN     "ActiveLog" TEXT;
