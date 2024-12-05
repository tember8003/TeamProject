/*
  Warnings:

  - Added the required column `GroupLeader` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "GroupLeader" TEXT NOT NULL;
