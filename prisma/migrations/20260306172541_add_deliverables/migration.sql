-- CreateTable
CREATE TABLE "MemberDeliverable" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "annualAllocation" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberDeliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverableCompletion" (
    "id" TEXT NOT NULL,
    "memberDeliverableId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliverableCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberDeliverable_memberId_year_name_key" ON "MemberDeliverable"("memberId", "year", "name");

-- AddForeignKey
ALTER TABLE "MemberDeliverable" ADD CONSTRAINT "MemberDeliverable_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverableCompletion" ADD CONSTRAINT "DeliverableCompletion_memberDeliverableId_fkey" FOREIGN KEY ("memberDeliverableId") REFERENCES "MemberDeliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
