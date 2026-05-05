/**
 * Performance Reports Listing Page
 * Shows all performance reports across all members
 */

import Link from 'next/link';
import Protected from '@/components/Protected';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-brand-orange/20 text-orange-800',
  reviewed: 'bg-brand-blue/30 text-blue-800',
  sent: 'bg-brand-green/30 text-green-800',
};

export default async function PerformanceReportsPage() {
  const reports = await prisma.performanceReport.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { generatedAt: 'desc' }],
    include: { member: { select: { id: true, name: true } } },
    take: 200,
  });

  const stats = {
    total: reports.length,
    draft: reports.filter((r) => r.status === 'draft').length,
    reviewed: reports.filter((r) => r.status === 'reviewed').length,
    sent: reports.filter((r) => r.status === 'sent').length,
  };

  return (
    <Protected>
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">Performance Reports</h1>
            <p className="mt-2 text-gray-600">
              Monthly practice performance reports with funnel analysis
            </p>
          </div>
          <Link
            href="/dashboard/performance/generate"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-navy hover:opacity-90"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate Report
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Total</div>
            <div className="text-2xl font-bold text-brand-navy">{stats.total}</div>
          </div>
          <div className="rounded-xl shadow-sm p-5 bg-brand-orange/20 border border-brand-orange">
            <div className="text-sm font-medium text-brand-navy mb-1">Draft</div>
            <div className="text-2xl font-bold text-brand-navy">{stats.draft}</div>
          </div>
          <div className="rounded-xl shadow-sm p-5 bg-brand-blue/30 border border-brand-blue">
            <div className="text-sm font-medium text-brand-navy mb-1">Reviewed</div>
            <div className="text-2xl font-bold text-brand-navy">{stats.reviewed}</div>
          </div>
          <div className="rounded-xl shadow-sm p-5 bg-brand-green/30 border border-brand-green">
            <div className="text-sm font-medium text-brand-navy mb-1">Sent</div>
            <div className="text-2xl font-bold text-brand-navy">{stats.sent}</div>
          </div>
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-brand-navy">No performance reports yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Configure a member&apos;s funnel mappings and generate your first report.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/dashboard/performance/${report.id}`}
                className="group bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-semibold text-brand-navy">
                    {MONTH_NAMES[report.month]} {report.year}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[report.status] ?? 'bg-gray-100 text-gray-800'}`}>
                    {report.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{report.member.name}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Generated {report.generatedAt.toLocaleDateString()}</span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-brand-navy transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Protected>
  );
}
