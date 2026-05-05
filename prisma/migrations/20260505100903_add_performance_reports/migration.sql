-- CreateTable
CREATE TABLE "MemberPerformanceConfig" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "averageOrderValue" DOUBLE PRECISION,
    "tcTrackerSheetId" TEXT,
    "funnelMappingDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberPerformanceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunnelStageMapping" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "prmCategoryId" TEXT NOT NULL,
    "prmCategoryName" TEXT NOT NULL,
    "funnelStage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FunnelStageMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceReport" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "funnelData" JSONB,
    "roiData" JSONB,
    "conversionRates" JSONB,
    "averageOrderValue" DOUBLE PRECISION,
    "summary" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfUrl" TEXT,

    CONSTRAINT "PerformanceReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberPerformanceConfig_memberId_key" ON "MemberPerformanceConfig"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "FunnelStageMapping_memberId_prmCategoryId_key" ON "FunnelStageMapping"("memberId", "prmCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceReport_memberId_year_month_key" ON "PerformanceReport"("memberId", "year", "month");

-- AddForeignKey
ALTER TABLE "MemberPerformanceConfig" ADD CONSTRAINT "MemberPerformanceConfig_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelStageMapping" ADD CONSTRAINT "FunnelStageMapping_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReport" ADD CONSTRAINT "PerformanceReport_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
