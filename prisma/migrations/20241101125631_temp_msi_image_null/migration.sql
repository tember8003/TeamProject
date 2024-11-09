/*
  Warnings:

  - You are about to drop the `Verification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Verification" DROP CONSTRAINT "Verification_userId_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "MSI_Image" DROP NOT NULL;

-- DropTable
DROP TABLE "Verification";
