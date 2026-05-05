/**
 * Server Actions for Performance Reports
 */

'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCategories } from '@/lib/allclients';
import { generatePerformanceReport } from '@/lib/performance/generator';
import type { PrmCategory } from '@/types/performance-report';

/**
 * Save performance config (AOV + TC Tracker sheet ID)
 */
export async function savePerformanceConfig(
  memberId: string,
  data: { averageOrderValue: number; tcTrackerSheetId?: string },
) {
  try {
    await prisma.memberPerformanceConfig.upsert({
      where: { memberId },
      create: {
        memberId,
        averageOrderValue: data.averageOrderValue,
        tcTrackerSheetId: data.tcTrackerSheetId || null,
      },
      update: {
        averageOrderValue: data.averageOrderValue,
        tcTrackerSheetId: data.tcTrackerSheetId || null,
      },
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    console.error('Error saving performance config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save config',
    };
  }
}

/**
 * Fetch PRM categories for a member
 */
export async function fetchPrmCategories(
  memberId: string,
): Promise<{ success: boolean; categories?: PrmCategory[]; error?: string }> {
  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { allClientsAccountId: true, allClientsApiKey: true },
    });

    if (!member?.allClientsAccountId || !member?.allClientsApiKey) {
      return { success: false, error: 'PRM credentials not configured' };
    }

    const categories = await getCategories(
      member.allClientsAccountId,
      member.allClientsApiKey,
    );

    return { success: true, categories };
  } catch (error) {
    console.error('Error fetching PRM categories:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch categories',
    };
  }
}

/**
 * Save funnel stage mappings for a member
 */
export async function saveFunnelMappings(
  memberId: string,
  mappings: { prmCategoryId: string; prmCategoryName: string; funnelStage: string }[],
) {
  try {
    // Delete existing mappings and recreate
    await prisma.funnelStageMapping.deleteMany({ where: { memberId } });

    if (mappings.length > 0) {
      await prisma.funnelStageMapping.createMany({
        data: mappings.map((m) => ({
          memberId,
          prmCategoryId: m.prmCategoryId,
          prmCategoryName: m.prmCategoryName,
          funnelStage: m.funnelStage,
        })),
      });
    }

    // Mark funnel mapping as done
    await prisma.memberPerformanceConfig.upsert({
      where: { memberId },
      create: { memberId, funnelMappingDone: true },
      update: { funnelMappingDone: true },
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    console.error('Error saving funnel mappings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save mappings',
    };
  }
}

/**
 * Get existing funnel mappings for a member
 */
export async function getFunnelMappings(memberId: string) {
  try {
    const mappings = await prisma.funnelStageMapping.findMany({
      where: { memberId },
      orderBy: { prmCategoryName: 'asc' },
    });

    return { success: true, mappings };
  } catch (error) {
    console.error('Error fetching funnel mappings:', error);
    return { success: false, mappings: [], error: 'Failed to fetch mappings' };
  }
}

/**
 * Generate a performance report
 */
export async function generatePerformanceReportAction(
  memberId: string,
  year: number,
  month: number,
  manualTxStarted?: number,
) {
  try {
    const reportId = await generatePerformanceReport({
      memberId,
      year,
      month,
      manualTxStarted,
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    revalidatePath('/dashboard/performance');
    return { success: true, reportId };
  } catch (error) {
    console.error('Error generating performance report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate report',
    };
  }
}

/**
 * Get a single performance report
 */
export async function getPerformanceReport(reportId: string) {
  try {
    const report = await prisma.performanceReport.findUnique({
      where: { id: reportId },
      include: { member: true },
    });

    return { success: true, report };
  } catch (error) {
    console.error('Error fetching performance report:', error);
    return { success: false, report: null, error: 'Failed to fetch report' };
  }
}

/**
 * Get all performance reports for a member
 */
export async function getPerformanceReportsByMember(memberId: string) {
  try {
    const reports = await prisma.performanceReport.findMany({
      where: { memberId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { member: { select: { name: true } } },
    });

    return { success: true, reports };
  } catch (error) {
    console.error('Error fetching performance reports:', error);
    return { success: false, reports: [], error: 'Failed to fetch reports' };
  }
}

/**
 * Delete a performance report
 */
export async function deletePerformanceReport(reportId: string) {
  try {
    const report = await prisma.performanceReport.findUnique({
      where: { id: reportId },
      select: { memberId: true },
    });

    await prisma.performanceReport.delete({ where: { id: reportId } });

    if (report) {
      revalidatePath(`/dashboard/members/${report.memberId}`);
    }
    revalidatePath('/dashboard/performance');
    return { success: true };
  } catch (error) {
    console.error('Error deleting performance report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete report',
    };
  }
}
