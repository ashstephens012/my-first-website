/**
 * Report Data Aggregator
 * Functions for fetching and formatting report data
 */

import { prisma } from '../prisma';
import type { Report, ReportActivity, Member } from '@prisma/client';

export type ReportWithDetails = Report & {
  member: Member;
  activities: ReportActivity[];
};

/**
 * Get complete report data with member and activities
 */
export async function getReportData(
  reportId: string
): Promise<ReportWithDetails | null> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      member: true,
      activities: {
        orderBy: { date: 'desc' },
      },
    },
  });

  return report;
}

/**
 * Get all reports for a specific member
 */
export async function getReportsByMember(
  memberId: string
): Promise<Report[]> {
  const reports = await prisma.report.findMany({
    where: { memberId },
    orderBy: { reportMonth: 'desc' },
  });

  return reports;
}

/**
 * Get all reports with optional filtering
 */
export async function getAllReports(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ReportWithDetails[]> {
  const { status, limit = 50, offset = 0 } = params || {};

  const reports = await prisma.report.findMany({
    where: status ? { status } : undefined,
    include: {
      member: true,
      activities: {
        orderBy: { date: 'desc' },
        take: 10, // Limit activities per report for list view
      },
    },
    orderBy: { reportMonth: 'desc' },
    take: limit,
    skip: offset,
  });

  return reports;
}

/**
 * Get reports statistics
 */
export async function getReportStats(): Promise<{
  total: number;
  draft: number;
  reviewed: number;
  sent: number;
}> {
  const [total, draft, reviewed, sent] = await Promise.all([
    prisma.report.count(),
    prisma.report.count({ where: { status: 'draft' } }),
    prisma.report.count({ where: { status: 'reviewed' } }),
    prisma.report.count({ where: { status: 'sent' } }),
  ]);

  return { total, draft, reviewed, sent };
}

/**
 * Get all reports for a specific month
 */
export async function getReportsByMonth(
  year: number,
  month: number
): Promise<ReportWithDetails[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const reports = await prisma.report.findMany({
    where: {
      reportMonth: {
        gte: startDate,
        lt: endDate,
      },
    },
    include: {
      member: true,
      activities: {
        orderBy: { date: 'desc' },
        take: 10,
      },
    },
    orderBy: { member: { name: 'asc' } },
  });

  return reports;
}

/**
 * Update report status
 */
export async function updateReportStatus(
  reportId: string,
  status: 'draft' | 'reviewed' | 'sent',
  reviewedBy?: string
): Promise<Report> {
  const updateData: any = { status };

  if (status === 'reviewed' && reviewedBy) {
    updateData.reviewedBy = reviewedBy;
    updateData.reviewedAt = new Date();
  }

  if (status === 'sent') {
    updateData.sentAt = new Date();
  }

  return await prisma.report.update({
    where: { id: reportId },
    data: updateData,
  });
}

/**
 * Delete a report and all its activities
 */
export async function deleteReport(reportId: string): Promise<void> {
  await prisma.report.delete({
    where: { id: reportId },
  });
}
