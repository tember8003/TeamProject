/*
  Warnings:

  - You are about to drop the column `images` on the `GroupActivity` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `GroupActivity` table. All the data in the column will be lost.
  - Made the column `description` on table `GroupActivity` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `surveyId` to the `GroupQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GroupActivity" DROP COLUMN "images",
DROP COLUMN "type",
ADD COLUMN     "ActivityImage" TEXT,
ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "GroupQuestion" ADD COLUMN     "surveyId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Survey" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GroupQuestion" ADD CONSTRAINT "GroupQuestion_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
