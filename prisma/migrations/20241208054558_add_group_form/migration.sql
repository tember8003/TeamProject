/*
  Warnings:

  - You are about to drop the column `surveyId` on the `GroupQuestion` table. All the data in the column will be lost.
  - You are about to drop the `Survey` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GroupQuestion" DROP CONSTRAINT "GroupQuestion_surveyId_fkey";

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "Form" TEXT;

-- AlterTable
ALTER TABLE "GroupQuestion" DROP COLUMN "surveyId";

-- DropTable
DROP TABLE "Survey";
