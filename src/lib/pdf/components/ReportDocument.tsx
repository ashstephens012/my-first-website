/**
 * PDF Report Document Component
 * Main PDF document structure
 */

import { Document, Page } from '@react-pdf/renderer';
import { pdfStyles } from '../styles';
import { ReportHeader } from './ReportHeader';
import { ExecutiveSummary } from './ExecutiveSummary';
import { MeetingsSection } from './MeetingsSection';
import { ReportFooter } from './ReportFooter';
import type { Member } from '@prisma/client';
import type { PdfActivity } from './MeetingsSection';

interface ReportDocumentProps {
  member: Member;
  reportMonth: Date;
  generatedAt: Date;
  summary: string;
  emailCount: number;
  meetingCount: number;
  activities: PdfActivity[];
}

export function ReportDocument({
  member,
  reportMonth,
  generatedAt,
  summary,
  emailCount,
  meetingCount,
  activities,
}: ReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <ReportHeader
          memberName={member.name}
          memberEmail={member.email}
          reportMonth={reportMonth}
          generatedAt={generatedAt}
          logoUrl={member.logoUrl}
        />

        <ExecutiveSummary
          summary={summary}
          emailCount={emailCount}
          meetingCount={meetingCount}
        />

        <MeetingsSection activities={activities} />

        <ReportFooter />
      </Page>
    </Document>
  );
}
