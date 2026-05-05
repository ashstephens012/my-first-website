/**
 * Performance Report Generator
 * Orchestrates data fetching, calculation, and report creation.
 */

import { prisma } from '@/lib/prisma';
import { fetchFunnelData, calculateConversionRates, calculateRoiData } from './funnel-fetcher';
import { reconcile } from './reconciler';
import { isGoogleSheetsConfigured, getSheetTabs, getTabData, parseTcTrackerData } from '@/lib/google-sheets';
import { generatePerformanceSummary } from '@/lib/ai/summarizer';
import type { FunnelData, FunnelStage } from '@/types/performance-report';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface GenerateOptions {
  memberId: string;
  year: number;
  month: number;
  manualTxStarted?: number;
}

/**
 * Generate a performance report for a member and month.
 * Returns the report ID.
 */
export async function generatePerformanceReport({
  memberId,
  year,
  month,
  manualTxStarted,
}: GenerateOptions): Promise<string> {
  // 1. Validate member has required config
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { performanceConfig: true },
  });

  if (!member) throw new Error('Member not found');
  if (!member.allClientsAccountId || !member.allClientsApiKey) {
    throw new Error('Member does not have PRM credentials configured');
  }
  if (!member.performanceConfig?.averageOrderValue) {
    throw new Error('Average order value not configured for this member');
  }
  if (!member.performanceConfig.funnelMappingDone) {
    throw new Error('Funnel stage mappings not configured for this member');
  }

  // 2. Delete existing report for this member/year/month if regenerating
  await prisma.performanceReport.deleteMany({
    where: { memberId, year, month },
  });

  // 3. Fetch funnel data from PRM
  const { funnelData, unmappedCount, contactStages } = await fetchFunnelData(memberId, year, month);

  // 4. If manual TX_STARTED provided, override the count
  let finalFunnelData: FunnelData = funnelData;
  if (manualTxStarted !== undefined && manualTxStarted >= 0) {
    finalFunnelData = funnelData.map((d) =>
      d.stage === 'TX_STARTED' ? { ...d, count: manualTxStarted } : d,
    );
  } else {
    // Fall back to CaseStartSubmission if no TX_STARTED from PRM
    const txFromPrm = funnelData.find((d) => d.stage === 'TX_STARTED')?.count ?? 0;
    if (txFromPrm === 0) {
      const submission = await prisma.caseStartSubmission.findUnique({
        where: { memberId_year_month: { memberId, year, month } },
      });
      if (submission) {
        finalFunnelData = funnelData.map((d) =>
          d.stage === 'TX_STARTED' ? { ...d, count: submission.caseStarts } : d,
        );
      }
    }
  }

  // 5. TC Tracker reconciliation (if configured)
  let discrepancies: { patientName: string; prmStage: string | null; tcTrackerStatus: string }[] | undefined;

  if (member.performanceConfig.tcTrackerSheetId && isGoogleSheetsConfigured()) {
    try {
      const sheetId = member.performanceConfig.tcTrackerSheetId;
      const tabs = await getSheetTabs(sheetId);
      const monthName = MONTH_NAMES[month - 1];
      const matchingTab = tabs.find(
        (t) => t.toLowerCase().includes(monthName.toLowerCase()),
      );

      if (matchingTab) {
        const rows = await getTabData(sheetId, matchingTab);
        const tcRecords = parseTcTrackerData(rows);
        const prmContacts = contactStages.map((c) => ({
          name: c.name,
          stage: c.stage,
        }));
        discrepancies = reconcile(prmContacts, tcRecords);
      }
    } catch (err) {
      console.error('TC Tracker reconciliation failed:', err);
    }
  }

  // 6. Calculate conversion rates and ROI
  const conversionRates = calculateConversionRates(finalFunnelData);
  const roiData = calculateRoiData(finalFunnelData, member.performanceConfig.averageOrderValue);

  // 7. Generate AI executive summary
  let summary: string | null = null;
  try {
    const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;
    summary = await generatePerformanceSummary(
      member.name,
      monthLabel,
      finalFunnelData,
      conversionRates,
      roiData,
      discrepancies,
    );
  } catch (err) {
    console.error('AI summary generation failed:', err);
  }

  // 8. Persist the report
  const report = await prisma.performanceReport.create({
    data: {
      memberId,
      year,
      month,
      status: 'draft',
      funnelData: finalFunnelData as any,
      roiData: roiData as any,
      conversionRates: conversionRates as any,
      averageOrderValue: member.performanceConfig.averageOrderValue,
      summary,
    },
  });

  return report.id;
}
