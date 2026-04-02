import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function PortalReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) redirect("/signin");
  if (session.user.portalTier === 2) redirect("/portal");

  const reports = await prisma.report.findMany({
    where: {
      memberId: session.user.memberId,
      status: "sent",
    },
    orderBy: { reportMonth: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-brand-navy mb-2">Your Reports</h1>
      <p className="text-gray-600 mb-8">
        Monthly consulting reports for your practice.
      </p>

      {reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No reports available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/portal/reports/${report.id}`}
              className="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-brand-blue transition-shadow"
            >
              <h3 className="text-lg font-semibold text-brand-navy mb-2">
                {format(report.reportMonth, "MMMM yyyy")}
              </h3>
              <div className="flex items-center gap-6 text-sm mb-3">
                <div>
                  <span className="font-medium text-brand-navy">
                    {report.emailCount}
                  </span>{" "}
                  <span className="text-gray-500">emails</span>
                </div>
                <div>
                  <span className="font-medium text-brand-navy">
                    {report.meetingCount}
                  </span>{" "}
                  <span className="text-gray-500">meetings</span>
                </div>
              </div>
              {report.summary && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {report.summary}
                </p>
              )}
              {report.sentAt && (
                <div className="text-xs text-gray-400">
                  Sent {format(report.sentAt, "MMM d, yyyy")}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
