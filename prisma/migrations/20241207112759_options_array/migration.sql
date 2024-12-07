/*
  Warnings:

  - The `options` column on the `Rating` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Rating" DROP COLUMN "options",
ADD COLUMN     "options" TEXT[];
