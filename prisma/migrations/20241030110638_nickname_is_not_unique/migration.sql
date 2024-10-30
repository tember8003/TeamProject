-- DropIndex
DROP INDEX "User_nickname_key";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "nickname" DROP NOT NULL;
