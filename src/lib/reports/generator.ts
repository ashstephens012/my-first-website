/**
 * Report Generator Service
 * Main orchestrator for generating monthly reports
 */

import { prisma } from '../prisma';
import { getActivitiesForMonth } from '../hubspot/fetchers';
import { generateExecutiveSummary, summarizeMeeting } from '../ai/summarizer';
import { format } from 'date-fns';

/**
 * Generate a monthly report for a member
 * @param memberId - Member ID from database
 * @param year - Year (e.g., 2024)
 * @param month - Month (1-12)
 * @returns Report ID of the generated report
 */
export async function generateMonthlyReport(
  memberId: string,
  year: number,
  month: number
): Promise<string> {
  console.log(
    `Starting report generation for member ${memberId}, ${year}-${month}`
  );

  // Get member details
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    throw new Error(`Member ${memberId} not found`);
  }

  if (member.status !== 'active') {
    throw new Error(`Member ${memberId} is not active`);
  }

  // Create report month date (first day of the month)
  const reportMonth = new Date(year, month - 1, 1);
  const monthName = format(reportMonth, 'MMMM yyyy');

  // Check if report already exists for this month
  const existingReport = await prisma.report.findFirst({
    where: {
      memberId,
      reportMonth,
    },
  });

  if (existingReport) {
    console.log(`Report already exists for ${monthName}, using existing report`);
    return existingReport.id;
  }

  // Step 1: Fetch activities from HubSpot
  console.log(`Fetching activities from HubSpot for ${monthName}...`);
  const activities = await getActivitiesForMonth(
    member.hubspotCompanyId,
    year,
    month
  );

  const emailCount = activities.filter((a) => a.type === 'email').length;
  const meetingCount = activities.filter((a) => a.type === 'meeting').length;

  console.log(`Found ${emailCount} emails and ${meetingCount} meetings`);

  // Step 2: Create draft report
  const report = await prisma.report.create({
    data: {
      memberId,
      reportMonth,
      status: 'draft',
      emailCount,
      meetingCount,
    },
  });

  console.log(`Created draft report ${report.id}`);

  // Step 3: Save activities to database (no per-activity AI summarization)
  if (activities.length > 0) {
    const reportActivities = activities.map((activity) => ({
      reportId: report.id,
      activityType: activity.type,
      hubspotId: activity.id,
      date: activity.date,
      subject: activity.subject,
      rawContent:
        activity.type === 'email' ? activity.content : activity.notes,
      summary: null,
      participants: JSON.stringify(activity.participants),
      metadata: activity.type === 'meeting' && activity.outcome
        ? { outcome: activity.outcome }
        : {},
    }));

    await prisma.reportActivity.createMany({
      data: reportActivities,
    });

    console.log(`Saved ${reportActivities.length} activities to database`);

    // Step 4: Generate per-meeting summaries
    const savedMeetings = await prisma.reportActivity.findMany({
      where: { reportId: report.id, activityType: 'meeting' },
    });

    for (const meeting of savedMeetings) {
      if (meeting.rawContent) {
        const participants = meeting.participants
          ? JSON.parse(meeting.participants)
          : [];
        const result = await summarizeMeeting(
          meeting.subject,
          meeting.rawContent,
          participants
        );
        if (result.summary) {
          await prisma.reportActivity.update({
            where: { id: meeting.id },
            data: { summary: JSON.stringify(result) },
          });
        }
      }
    }

    if (savedMeetings.length > 0) {
      console.log(`Generated summaries for ${savedMeetings.length} meetings`);
    }

    // Step 5: Generate executive summary (single AI call)
    console.log('Generating executive summary...');
    const activityData = reportActivities.map((a) => ({
      type: a.activityType as 'email' | 'meeting',
      date: a.date,
      subject: a.subject,
      participants: a.participants,
    }));

    const executiveSummary = await generateExecutiveSummary(
      activityData,
      monthName,
      emailCount,
      meetingCount
    );

    // Step 6: Update report with executive summary
    await prisma.report.update({
      where: { id: report.id },
      data: {
        summary: executiveSummary,
      },
    });

    console.log('Executive summary generated and saved');
  } else {
    console.log('No activities found for this month');
    await prisma.report.update({
      where: { id: report.id },
      data: {
        summary: `No emails or meetings were recorded for ${member.name} in ${monthName}.`,
      },
    });
  }

  console.log(`Report generation complete: ${report.id}`);
  return report.id;
}

/**
 * Generate reports for all active members for a specific month
 * Used by cron job for automated generation
 */
export async function generateReportsForAllMembers(
  year: number,
  month: number
): Promise<{ success: string[]; failed: Array<{ memberId: string; error: string }> }> {
  const members = await prisma.member.findMany({
    where: { status: 'active' },
  });

  console.log(`Generating reports for ${members.length} active members`);

  const success: string[] = [];
  const failed: Array<{ memberId: string; error: string }> = [];

  for (const member of members) {
    try {
      const reportId = await generateMonthlyReport(member.id, year, month);
      success.push(reportId);
      console.log(`✓ Report generated for ${member.name}: ${reportId}`);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error';
      failed.push({ memberId: member.id, error: errorMsg });
      console.error(`✗ Failed to generate report for ${member.name}:`, errorMsg);
    }
  }

  console.log(`Report generation summary: ${success.length} succeeded, ${failed.length} failed`);

  return { success, failed };
}
