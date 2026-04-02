/**
 * Reports Listing Page
 * Shows reports grouped by year → month with card grid layout
 */

import Link from 'next/link';
import { format } from 'date-fns';
import Protected from '@/components/Protected';
import { getAllReports, getReportStats } from '@/lib/reports/aggregator';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const [reports, stats] = await Promise.all([
    getAllReports({ limit: 500 }),
    getReportStats(),
  ]);

  // Group reports by month
  const monthGroups = new Map<string, { date: Date; count: number }>();
  for (const report of reports) {
    const key = format(report.reportMonth, 'yyyy-MM');
    if (!monthGroups.has(key)) {
      monthGroups.set(key, { date: report.reportMonth, count: 0 });
    }
    monthGroups.get(key)!.count++;
  }

  // Sort descending (newest first)
  const sortedMonths = Array.from(monthGroups.entries()).sort(
    (a, b) => b[1].date.getTime() - a[1].date.getTime()
  );

  // Group by year
  const yearGroups = new Map<number, { key: string; date: Date; count: number }[]>();
  for (const [key, { date, count }] of sortedMonths) {
    const year = date.getFullYear();
    if (!yearGroups.has(year)) {
      yearGroups.set(year, []);
    }
    yearGroups.get(year)!.push({ key, date, count });
  }

  // Sort years descending
  const sortedYears = Array.from(yearGroups.entries()).sort(
    (a, b) => b[0] - a[0]
  );

  return (
    <Protected>
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">Reports</h1>
            <p className="mt-2 text-gray-600">
              View and manage monthly activity reports
            </p>
          </div>
          <Link
            href="/dashboard/reports/generate"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-navy hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy"
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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">
              Total Reports
            </div>
            <div className="text-2xl font-bold text-brand-navy">{stats.total}</div>
          </div>
          <div className="rounded-xl shadow-sm p-5 bg-brand-orange/20 border border-brand-orange">
            <div className="text-sm font-medium text-brand-navy mb-1">Draft</div>
            <div className="text-2xl font-bold text-brand-navy">
              {stats.draft}
            </div>
          </div>
          <div className="rounded-xl shadow-sm p-5 bg-brand-blue/30 border border-brand-blue">
            <div className="text-sm font-medium text-brand-navy mb-1">
              Reviewed
            </div>
            <div className="text-2xl font-bold text-brand-navy">
              {stats.reviewed}
            </div>
          </div>
          <div className="rounded-xl shadow-sm p-5 bg-brand-green/30 border border-brand-green">
            <div className="text-sm font-medium text-brand-navy mb-1">Sent</div>
            <div className="text-2xl font-bold text-brand-navy">{stats.sent}</div>
          </div>
        </div>

        {/* Months grouped by year */}
        {sortedMonths.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-brand-navy">
              No reports yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Generate your first monthly report to get started.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/reports/generate"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-navy hover:opacity-90"
              >
                Generate Report
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedYears.map(([year, months]) => (
              <section key={year}>
                <h2 className="text-xl font-bold text-brand-navy mb-4">{year}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {months.map(({ key, date, count }) => {
                    const y = date.getFullYear();
                    const m = date.getMonth() + 1;
                    return (
                      <Link
                        key={key}
                        href={`/dashboard/reports/month/${y}/${m}`}
                        className="group bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold text-brand-navy">
                            {format(date, 'MMMM')}
                          </h3>
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-brand-navy transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          {count} {count === 1 ? 'report' : 'reports'}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </Protected>
  );
}
