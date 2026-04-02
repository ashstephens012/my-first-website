/**
 * Individual Report Detail Page
 * Shows full report with activities and actions
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import Protected from '@/components/Protected';
import { StatusBadge } from '@/components/StatusBadge';
import { getReportData } from '@/lib/reports/aggregator';
import { ReportActions } from './ReportActions';

export const dynamic = 'force-dynamic';

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReportData(id);

  if (!report) {
    notFound();
  }

  const monthYear = format(report.reportMonth, 'MMMM yyyy');
  const generatedDate = format(report.generatedAt, 'MMM d, yyyy h:mm a');

  return (
    <Protected>
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link
            href="/dashboard/reports"
            className="text-brand-navy hover:text-brand-navy/70"
          >
            Reports
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link
            href={`/dashboard/reports/month/${report.reportMonth.getFullYear()}/${report.reportMonth.getMonth() + 1}`}
            className="text-brand-navy hover:text-brand-navy/70"
          >
            {monthYear}
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">{report.member.name}</span>
        </nav>

        {/* Report Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-navy mb-2">
                {monthYear} Report
              </h1>
              <Link
                href={`/dashboard/members/${report.member.id}`}
                className="text-lg text-brand-navy underline decoration-brand-blue hover:text-brand-navy/70"
              >
                {report.member.name}
              </Link>
            </div>
            <StatusBadge status={report.status as any} />
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Generated</div>
              <div className="text-sm text-brand-navy">{generatedDate}</div>
            </div>
            <div className="rounded-md bg-brand-blue/20 p-3 border-t-2 border-brand-blue">
              <div className="text-xs text-gray-500 mb-1">Emails</div>
              <div className="text-xl font-bold text-brand-navy">{report.emailCount}</div>
            </div>
            <div className="rounded-md bg-brand-green/20 p-3 border-t-2 border-brand-green">
              <div className="text-xs text-gray-500 mb-1">Meetings</div>
              <div className="text-xl font-bold text-brand-navy">{report.meetingCount}</div>
            </div>
            <div className="rounded-md bg-[#f7f9fb] p-3 border-t-2 border-brand-navy">
              <div className="text-xs text-gray-500 mb-1">Total Interactions</div>
              <div className="text-xl font-bold text-brand-navy">{report.emailCount + report.meetingCount}</div>
            </div>
          </div>

          {/* Actions */}
          <ReportActions reportId={report.id} currentStatus={report.status} />
        </div>

        {/* Executive Summary */}
        {report.summary && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-bold text-brand-navy mb-4">
              Executive Summary
            </h2>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {report.summary}
            </p>
          </div>
        )}

        {/* No Activities */}
        {report.activities.length === 0 && !report.summary && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <p className="text-gray-500">
              No activities recorded for this period.
            </p>
          </div>
        )}
      </div>
    </Protected>
  );
}
