/**
 * Month Detail View
 * Shows all reports for a specific month with member names
 */

import Link from 'next/link';

import { format } from 'date-fns';
import { notFound } from 'next/navigation';
import Protected from '@/components/Protected';
import { StatusBadge } from '@/components/StatusBadge';
import { getReportsByMonth } from '@/lib/reports/aggregator';

export const dynamic = 'force-dynamic';

export default async function MonthReportsPage({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    notFound();
  }

  const reports = await getReportsByMonth(year, month);
  const monthDate = new Date(year, month - 1, 1);
  const monthLabel = format(monthDate, 'MMMM yyyy');

  return (
    <Protected>
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link
            href="/dashboard/reports"
            className="text-brand-navy hover:text-brand-navy/70"
          >
            Reports
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">{monthLabel}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">{monthLabel}</h1>
            <p className="mt-2 text-gray-600">
              {reports.length} {reports.length === 1 ? 'report' : 'reports'}
            </p>
          </div>
          <Link
            href="/dashboard/reports/generate"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-navy hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Generate Report
          </Link>
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <h3 className="text-lg font-medium text-brand-navy">
              No reports for {monthLabel}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Generate a report to get started.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200">
            {reports.map((report) => {
              const initials = report.member.name
                .split(' ')
                .map((w) => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <Link
                  key={report.id}
                  href={`/dashboard/reports/${report.id}`}
                  className="flex items-center px-6 py-4 hover:bg-brand-blue/20 transition-colors"
                >
                  {report.member.logoUrl ? (
                    <img
                      src={report.member.logoUrl}
                      alt={report.member.name}
                      className="shrink-0 w-9 h-9 rounded-lg object-contain mr-4"
                    />
                  ) : (
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-brand-blue/20 flex items-center justify-center text-xs font-semibold text-brand-navy mr-4">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-brand-navy truncate">
                      {report.member.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {report.member.email}
                    </p>
                  </div>
                  <div className="mx-6 shrink-0">
                    <StatusBadge status={report.status as any} />
                  </div>
                  <div className="shrink-0 flex items-center gap-4 text-sm text-gray-500">
                    <span>{report.emailCount} emails</span>
                    <span>{report.meetingCount} meetings</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Protected>
  );
}
