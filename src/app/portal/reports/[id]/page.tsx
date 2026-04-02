import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function PortalReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) redirect("/signin");
  if (session.user.portalTier === 2) redirect("/portal");

  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { id },
    include: { member: true },
  });

  // Return 404 for reports not belonging to this member or not sent
  if (!report || report.memberId !== session.user.memberId || report.status !== "sent") {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm">
        <Link
          href="/portal/reports"
          className="text-brand-navy hover:text-brand-navy/70"
        >
          Reports
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600">
          {format(report.reportMonth, "MMMM yyyy")}
        </span>
      </nav>

      {/* Report Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">
              {format(report.reportMonth, "MMMM yyyy")} Report
            </h1>
            {report.sentAt && (
              <p className="text-sm text-gray-500 mt-1">
                Sent {format(report.sentAt, "MMM d, yyyy")}
              </p>
            )}
          </div>
          {report.pdfUrl && (
            <a
              href={report.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-brand-navy text-white rounded-md text-sm font-medium hover:opacity-90"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download PDF
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-brand-navy">
              {report.emailCount}
            </div>
            <div className="text-sm text-gray-500">Emails</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-brand-navy">
              {report.meetingCount}
            </div>
            <div className="text-sm text-gray-500">Meetings</div>
          </div>
        </div>

        {/* Summary */}
        {report.summary && (
          <div>
            <h2 className="text-lg font-semibold text-brand-navy mb-2">
              Summary
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {report.summary}
            </div>
          </div>
        )}
      </div>

      <Link
        href="/portal/reports"
        className="text-sm text-brand-navy hover:underline"
      >
        Back to all reports
      </Link>
    </div>
  );
}
