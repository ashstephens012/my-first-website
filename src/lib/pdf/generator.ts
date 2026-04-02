/**
 * PDF Generation Service
 * Renders React PDF documents and handles storage
 */

import { renderToBuffer } from '@react-pdf/renderer';
import { ReportDocument } from './components/ReportDocument';
import { getReportData } from '../reports/aggregator';
import { prisma } from '../prisma';
import { uploadToS3 } from '../s3';
import { format } from 'date-fns';

/**
 * Generate PDF for a report and return as buffer
 */
export async function generatePDF(reportId: string): Promise<Buffer> {
  const report = await getReportData(reportId);

  if (!report) {
    throw new Error(`Report ${reportId} not found`);
  }

  // Render PDF document
  const pdfBuffer = await renderToBuffer(
    ReportDocument({
      member: report.member,
      reportMonth: report.reportMonth,
      generatedAt: report.generatedAt,
      summary: report.summary || 'No summary available',
      emailCount: report.emailCount,
      meetingCount: report.meetingCount,
      activities: report.activities.map((a) => ({
        ...a,
        date: a.date.toISOString(),
        rawContent: a.rawContent ?? null,
        metadata: a.metadata as Record<string, unknown> ?? null,
      })),
    })
  );

  return pdfBuffer;
}

/**
 * Generate PDF and upload to S3
 * Updates report record with PDF URL
 */
export async function generateAndUploadPDF(reportId: string): Promise<string> {
  const report = await getReportData(reportId);

  if (!report) {
    throw new Error(`Report ${reportId} not found`);
  }

  // Generate PDF buffer
  const pdfBuffer = await generatePDF(reportId);

  // Create filename
  const monthYear = format(report.reportMonth, 'yyyy-MM');
  const filename = `reports/${report.member.id}/${monthYear}-${reportId}.pdf`;

  try {
    // Upload to S3 if configured
    const pdfUrl = await uploadToS3(
      pdfBuffer,
      filename,
      'application/pdf'
    );

    // Update report with PDF URL
    await prisma.report.update({
      where: { id: reportId },
      data: { pdfUrl },
    });

    return pdfUrl;
  } catch (error) {
    console.error('Error uploading PDF to S3:', error);
    throw new Error('Failed to upload PDF');
  }
}

/**
 * Generate PDF and return as downloadable buffer
 * Use this for direct downloads without storage
 */
export async function downloadPDF(reportId: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const report = await getReportData(reportId);

  if (!report) {
    throw new Error(`Report ${reportId} not found`);
  }

  const pdfBuffer = await generatePDF(reportId);

  const monthYear = format(report.reportMonth, 'yyyy-MM');
  const filename = `${report.member.name.replace(/[^a-z0-9]/gi, '-')}-Report-${monthYear}.pdf`;

  return {
    buffer: pdfBuffer,
    filename,
  };
}
