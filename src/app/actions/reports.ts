/**
 * Server Actions for Report Management
 */

'use server';

import { revalidatePath } from 'next/cache';
import { generateMonthlyReport } from '@/lib/reports/generator';
import { updateReportStatus, deleteReport } from '@/lib/reports/aggregator';
import { downloadPDF } from '@/lib/pdf/generator';

/**
 * Generate a monthly report for a member
 */
export async function generateReport(
  memberId: string,
  year: number,
  month: number
) {
  try {
    const reportId = await generateMonthlyReport(memberId, year, month);

    revalidatePath('/dashboard/reports');
    revalidatePath(`/dashboard/members/${memberId}`);

    return { success: true, reportId };
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate report',
    };
  }
}

/**
 * Update report status (draft -> reviewed -> sent)
 */
export async function updateStatus(
  reportId: string,
  status: 'draft' | 'reviewed' | 'sent',
  reviewedBy?: string
) {
  try {
    await updateReportStatus(reportId, status, reviewedBy);

    revalidatePath('/dashboard/reports');
    revalidatePath(`/dashboard/reports/${reportId}`);

    return { success: true };
  } catch (error) {
    console.error('Error updating report status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    };
  }
}

/**
 * Delete a report
 */
export async function removeReport(reportId: string) {
  try {
    await deleteReport(reportId);

    revalidatePath('/dashboard/reports');
    return { success: true };
  } catch (error) {
    console.error('Error deleting report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete report',
    };
  }
}

/**
 * Download PDF for a report
 */
export async function getPDF(reportId: string) {
  try {
    const { buffer, filename } = await downloadPDF(reportId);

    return {
      success: true,
      pdf: buffer.toString('base64'),
      filename,
    };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    };
  }
}
