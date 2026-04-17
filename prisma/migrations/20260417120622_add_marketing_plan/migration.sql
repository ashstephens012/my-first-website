-- CreateTable
CREATE TABLE "MarketingPlan" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingChannel" (
    "id" TEXT NOT NULL,
    "marketingPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "alwaysOn" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingActivity" (
    "id" TEXT NOT NULL,
    "marketingChannelId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "ownership" TEXT NOT NULL DEFAULT 'TIO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketingPlan_memberId_year_key" ON "MarketingPlan"("memberId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingChannel_marketingPlanId_name_key" ON "MarketingChannel"("marketingPlanId", "name");

-- CreateIndex
CREATE INDEX "MarketingActivity_marketingChannelId_month_idx" ON "MarketingActivity"("marketingChannelId", "month");

-- AddForeignKey
ALTER TABLE "MarketingPlan" ADD CONSTRAINT "MarketingPlan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingChannel" ADD CONSTRAINT "MarketingChannel_marketingPlanId_fkey" FOREIGN KEY ("marketingPlanId") REFERENCES "MarketingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingActivity" ADD CONSTRAINT "MarketingActivity_marketingChannelId_fkey" FOREIGN KEY ("marketingChannelId") REFERENCES "MarketingChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
