/*
  Warnings:

  - A unique constraint covering the columns `[userId,groupId]` on the table `UserGroup` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserGroup_userId_groupId_key" ON "UserGroup"("userId", "groupId");
