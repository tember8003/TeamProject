/*
  Warnings:

  - Added the required column `ActiceLog` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "ActiceLog" TEXT NOT NULL,
ADD COLUMN     "IntroduceImage" TEXT;
