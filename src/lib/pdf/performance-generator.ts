/**
 * Performance Report PDF Generation
 * Renders and downloads performance report PDFs
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { prisma } from '../prisma';
import { PerformanceReportDocument } from './components/PerformanceReportDocument';
import type { FunnelData, ConversionRates, RoiData } from '@/types/performance-report';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Generate a performance report PDF buffer
 */
export async function generatePerformancePDF(reportId: string): Promise<Buffer> {
  const report = await prisma.performanceReport.findUnique({
    where: { id: reportId },
    include: { member: true },
  });

  if (!report) {
    throw new Error(`Performance report ${reportId} not found`);
  }

  const funnelData = (report.funnelData as unknown as FunnelData) ?? [];
  const conversionRates = (report.conversionRates as unknown as ConversionRates) ?? {
    leadToBooking: null,
    bookingToAttendance: null,
    attendanceToStart: null,
    overallLeadToStart: null,
  };
  const roiData = (report.roiData as unknown as RoiData) ?? {
    pipelineValue: 0,
    actualRevenue: 0,
    potentialLostRevenue: 0,
    averageOrderValue: report.averageOrderValue ?? 0,
  };

  const pdfBuffer = await renderToBuffer(
    PerformanceReportDocument({
      memberName: report.member.name,
      memberEmail: report.member.email,
      year: report.year,
      month: report.month,
      generatedAt: report.generatedAt,
      summary: report.summary || 'No summary available',
      funnelData,
      conversionRates,
      roiData,
      logoUrl: report.member.logoUrl,
    }),
  );

  return pdfBuffer;
}

/**
 * Generate PDF and return as downloadable buffer with filename
 */
export async function downloadPerformancePDF(reportId: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const report = await prisma.performanceReport.findUnique({
    where: { id: reportId },
    include: { member: { select: { name: true } } },
  });

  if (!report) {
    throw new Error(`Performance report ${reportId} not found`);
  }

  const pdfBuffer = await generatePerformancePDF(reportId);

  const safeName = report.member.name.replace(/[^a-z0-9]/gi, '-');
  const filename = `${safeName}-Performance-${MONTH_NAMES[report.month]}-${report.year}.pdf`;

  return { buffer: pdfBuffer, filename };
}
