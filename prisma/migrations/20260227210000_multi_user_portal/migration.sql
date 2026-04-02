-- DropIndex
DROP INDEX IF EXISTS "User_memberId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "portalTier" INTEGER;
