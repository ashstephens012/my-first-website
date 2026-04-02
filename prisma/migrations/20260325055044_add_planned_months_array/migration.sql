-- AlterTable
ALTER TABLE "MemberDeliverable" ADD COLUMN     "plannedMonths" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
