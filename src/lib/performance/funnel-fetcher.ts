/**
 * Funnel Data Fetcher
 * Fetches contacts from PRM for a given month and maps them to funnel stages.
 */

import { prisma } from '@/lib/prisma';
import { getContactsWithCategories } from '@/lib/allclients';
import type {
  FunnelData,
  FunnelStage,
  ConversionRates,
  RoiData,
  PrmCategory,
} from '@/types/performance-report';
import { FUNNEL_STAGES } from '@/types/performance-report';

/**
 * Fetch funnel data for a member's reporting month.
 *
 * Cohort approach: fetch all contacts added during the month,
 * then check their CURRENT categories to determine funnel stage.
 */
export async function fetchFunnelData(
  memberId: string,
  year: number,
  month: number,
): Promise<{ funnelData: FunnelData; unmappedCount: number; contactStages: { name: string; stage: FunnelStage | null }[] }> {
  // Get member's PRM credentials
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { allClientsAccountId: true, allClientsApiKey: true },
  });

  if (!member?.allClientsAccountId || !member?.allClientsApiKey) {
    throw new Error('Member does not have PRM credentials configured');
  }

  // Get funnel stage mappings
  const mappings = await prisma.funnelStageMapping.findMany({
    where: { memberId },
  });

  if (mappings.length === 0) {
    throw new Error('No funnel stage mappings configured for this member');
  }

  // Build category ID → funnel stage lookup
  const categoryToStage = new Map<string, FunnelStage>();
  for (const m of mappings) {
    categoryToStage.set(m.prmCategoryId, m.funnelStage as FunnelStage);
  }

  // Fetch contacts added during the reporting month
  const startOfMonth = new Date(year, month - 1, 1);
  const startOfNextMonth = new Date(year, month, 1);

  const contacts = await getContactsWithCategories(
    member.allClientsAccountId,
    member.allClientsApiKey,
    startOfMonth,
    startOfNextMonth,
  );

  // Map each contact to a funnel stage based on their current categories
  const stageCounts = new Map<FunnelStage, { count: number; categoryIds: Set<string> }>();
  for (const stage of FUNNEL_STAGES) {
    stageCounts.set(stage, { count: 0, categoryIds: new Set() });
  }

  let unmappedCount = 0;
  const contactStages: { name: string; stage: FunnelStage | null }[] = [];

  for (const contact of contacts) {
    // Extract categories from the contact
    const rawCats = contact.categories?.category;
    const cats: PrmCategory[] = Array.isArray(rawCats)
      ? rawCats
      : rawCats
        ? [rawCats]
        : [];

    // Find the highest funnel stage this contact is in
    let highestStage: FunnelStage | null = null;
    let highestIndex = -1;

    for (const cat of cats) {
      const stage = categoryToStage.get(cat.categoryid);
      if (stage) {
        const idx = FUNNEL_STAGES.indexOf(stage);
        if (idx > highestIndex) {
          highestIndex = idx;
          highestStage = stage;
        }
      }
    }

    const name = `${contact.firstname} ${contact.lastname}`.trim();

    if (highestStage) {
      const entry = stageCounts.get(highestStage)!;
      entry.count++;
      for (const cat of cats) {
        if (categoryToStage.get(cat.categoryid) === highestStage) {
          entry.categoryIds.add(cat.categoryid);
        }
      }
      contactStages.push({ name, stage: highestStage });
    } else {
      unmappedCount++;
      contactStages.push({ name, stage: null });
    }
  }

  const funnelData: FunnelData = FUNNEL_STAGES.map((stage) => {
    const entry = stageCounts.get(stage)!;
    return {
      stage,
      count: entry.count,
      prmCategoryIds: Array.from(entry.categoryIds),
    };
  });

  return { funnelData, unmappedCount, contactStages };
}

/**
 * Calculate conversion rates from funnel data.
 */
export function calculateConversionRates(funnelData: FunnelData): ConversionRates {
  const getCount = (stage: FunnelStage) =>
    funnelData.find((d) => d.stage === stage)?.count ?? 0;

  const leads = getCount('LEAD') + getCount('CONSULT_BOOKED') + getCount('CONSULT_ATTENDED') + getCount('TX_STARTED') + getCount('TX_NOT_STARTED');
  const booked = getCount('CONSULT_BOOKED') + getCount('CONSULT_ATTENDED') + getCount('TX_STARTED') + getCount('TX_NOT_STARTED');
  const attended = getCount('CONSULT_ATTENDED') + getCount('TX_STARTED') + getCount('TX_NOT_STARTED');
  const started = getCount('TX_STARTED');

  return {
    leadToBooking: leads > 0 ? Math.round((booked / leads) * 100) : null,
    bookingToAttendance: booked > 0 ? Math.round((attended / booked) * 100) : null,
    attendanceToStart: attended > 0 ? Math.round((started / attended) * 100) : null,
    overallLeadToStart: leads > 0 ? Math.round((started / leads) * 100) : null,
  };
}

/**
 * Calculate ROI data from funnel data and average order value.
 */
export function calculateRoiData(funnelData: FunnelData, aov: number): RoiData {
  const getCount = (stage: FunnelStage) =>
    funnelData.find((d) => d.stage === stage)?.count ?? 0;

  const pipeline = (getCount('CONSULT_BOOKED') + getCount('CONSULT_ATTENDED')) * aov;
  const actual = getCount('TX_STARTED') * aov;
  const lost = getCount('TX_NOT_STARTED') * aov;

  return {
    pipelineValue: pipeline,
    actualRevenue: actual,
    potentialLostRevenue: lost,
    averageOrderValue: aov,
  };
}
