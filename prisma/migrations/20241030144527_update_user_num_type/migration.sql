/*
  Warnings:

  - Changed the type of `userNum` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "userNum",
ADD COLUMN     "userNum" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_userNum_key" ON "User"("userNum");
