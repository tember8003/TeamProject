/*
  Warnings:

  - Made the column `MSI_Image` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "MSI_Image" SET NOT NULL;
