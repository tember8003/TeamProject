/*
  Warnings:

  - You are about to alter the column `answerText` on the `GroupAnswer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `questionText` on the `GroupQuestion` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "isRatingPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "totalCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "GroupAnswer" ALTER COLUMN "answerText" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "GroupQuestion" ALTER COLUMN "questionText" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Rating" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
