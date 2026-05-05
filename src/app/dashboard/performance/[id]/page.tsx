/**
 * Performance Report Detail Page
 * Shows funnel data, conversion rates, ROI, and AI executive summary
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import Protected from '@/components/Protected';
import { prisma } from '@/lib/prisma';
import FunnelChart from '@/components/FunnelChart';
import ConversionRateCards from '@/components/ConversionRateCards';
import RoiCards from '@/components/RoiCards';
import PerformanceReportActions from './PerformanceReportActions';
import type { FunnelData, ConversionRates, RoiData } from '@/types/performance-report';

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

export default async function PerformanceReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const report = await prisma.performanceReport.findUnique({
    where: { id },
    include: { member: true },
  });

  if (!report) {
    notFound();
  }

  const monthYear = `${MONTH_NAMES[report.month]} ${report.year}`;
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

  return (
    <Protected>
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link
            href="/dashboard/performance"
            className="text-brand-navy hover:text-brand-navy/70"
          >
            Performance Reports
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link
            href={`/dashboard/members/${report.member.id}`}
            className="text-brand-navy hover:text-brand-navy/70"
          >
            {report.member.name}
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">{monthYear}</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-navy mb-2">
                {monthYear} Performance Report
              </h1>
              <Link
                href={`/dashboard/members/${report.member.id}`}
                className="text-lg text-brand-navy underline decoration-brand-blue hover:text-brand-navy/70"
              >
                {report.member.name}
              </Link>
            </div>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLES[report.status] ?? 'bg-gray-100 text-gray-800'}`}
            >
              {report.status}
            </span>
          </div>

          <div className="text-xs text-gray-500 mb-4">
            Generated {report.generatedAt.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>

          <p className="text-xs text-gray-400 italic">
            Note: This report shows where {MONTH_NAMES[report.month]}&apos;s leads currently sit in the funnel as of the report generation date.
          </p>

          <PerformanceReportActions reportId={report.id} />
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

        {/* Patient Journey Funnel */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-brand-navy mb-4">
            Patient Journey Funnel
          </h2>
          {funnelData.length > 0 ? (
            <FunnelChart data={funnelData} />
          ) : (
            <p className="text-gray-500 text-sm">No funnel data available.</p>
          )}
        </div>

        {/* Conversion Rates */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-brand-navy mb-4">
            Conversion Rates
          </h2>
          <ConversionRateCards rates={conversionRates} />
        </div>

        {/* Revenue & ROI */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-bold text-brand-navy mb-4">
            Revenue &amp; ROI
          </h2>
          <RoiCards data={roiData} />
        </div>
      </div>
    </Protected>
  );
}
