-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ALTER COLUMN "GroupImage" DROP NOT NULL,
ALTER COLUMN "isOfficial" SET DEFAULT false;
