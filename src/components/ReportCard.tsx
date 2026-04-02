/**
 * Report Card Component
 * Displays report summary in a card layout
 */

import Link from 'next/link';
import { format } from 'date-fns';
import { StatusBadge } from './StatusBadge';
import type { Report, Member } from '@prisma/client';

interface ReportCardProps {
  report: Report & { member?: Member };
}

export function ReportCard({ report }: ReportCardProps) {
  const monthYear = format(report.reportMonth, 'MMMM yyyy');
  const generatedDate = format(report.generatedAt, 'MMM d, yyyy');

  return (
    <Link
      href={`/dashboard/reports/${report.id}`}
      className="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-brand-blue transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-brand-navy mb-1">
            {monthYear}
          </h3>
          {report.member && (
            <p className="text-sm text-gray-600">{report.member.name}</p>
          )}
        </div>
        <StatusBadge status={report.status as any} />
      </div>

      <div className="flex items-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="font-medium text-brand-navy">{report.emailCount}</span>
          <span className="text-gray-500">emails</span>
        </div>
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="font-medium text-brand-navy">{report.meetingCount}</span>
          <span className="text-gray-500">meetings</span>
        </div>
      </div>

      {report.summary && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {report.summary}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Generated {generatedDate}</span>
        {report.reviewedBy && (
          <span>Reviewed by {report.reviewedBy}</span>
        )}
      </div>
    </Link>
  );
}
