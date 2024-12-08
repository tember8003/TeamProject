/*
  Warnings:

  - You are about to drop the column `role` on the `UserGroup` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserGroup" DROP COLUMN "role",
ALTER COLUMN "status" SET DEFAULT 'approved';
