-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "allClientsAccountId" TEXT,
ADD COLUMN     "allClientsApiKey" TEXT;

-- CreateTable
CREATE TABLE "PrmContactCount" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "contactCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrmContactCount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrmContactCount_memberId_year_month_key" ON "PrmContactCount"("memberId", "year", "month");

-- AddForeignKey
ALTER TABLE "PrmContactCount" ADD CONSTRAINT "PrmContactCount_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
