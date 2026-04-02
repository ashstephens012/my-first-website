import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
import PrmContactCounts from "@/components/PrmContactCounts";
import RefreshPrmButton from "@/components/RefreshPrmButton";
import UpcomingMeetings from "@/components/UpcomingMeetings";
import { isHubSpotConfigured } from "@/lib/hubspot/client";
import { getUpcomingMeetings } from "@/lib/hubspot/fetchers";
import YearlyRoadmap, { distributeAcrossYear, fixedMonthItem, fixedMonthsItems } from "@/components/YearlyRoadmap";
import type { ActivitySection, ActivityRow } from "@/components/YearlyRoadmap";

export default async function PortalHomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) redirect("/signin");

  const currentYear = new Date().getFullYear();

  const [member, ytdAggregate, submissions, prmCounts, allCaseStarts, quarterlyFocuses, deliverables] = await Promise.all([
    prisma.member.findUnique({
      where: { id: session.user.memberId },
      include: {
        reports: {
          where: { status: "sent" },
          orderBy: { reportMonth: "desc" },
          take: 3,
        },
      },
    }),
    prisma.caseStartSubmission.aggregate({
      where: { memberId: session.user.memberId, year: currentYear },
      _sum: { caseStarts: true },
    }),
    prisma.caseStartSubmission.findMany({
      where: { memberId: session.user.memberId, year: currentYear },
      select: { month: true },
    }),
    prisma.prmContactCount.findMany({
      where: { memberId: session.user.memberId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
    prisma.caseStartSubmission.findMany({
      where: { memberId: session.user.memberId },
      select: { year: true, month: true, caseStarts: true },
    }),
    prisma.quarterlyFocus.findMany({
      where: { memberId: session.user.memberId, year: currentYear },
      select: { quarter: true, focus: true },
      orderBy: { quarter: 'asc' },
    }),
    prisma.memberDeliverable.findMany({
      where: { memberId: session.user.memberId, year: currentYear },
      include: { completions: true },
    }),
  ]);

  if (!member) redirect("/signin");

  const upcomingMeetings =
    isHubSpotConfigured() && member.hubspotCompanyId
      ? await getUpcomingMeetings(member.hubspotCompanyId)
      : [];

  const ytdTotal = ytdAggregate._sum.caseStarts ?? 0;

  // Parse target — handles "150" or "100-150" (uses upper bound for ranges)
  function parseTarget(target: string | null): number | null {
    if (!target) return null;
    const rangeMatch = target.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) return parseInt(rangeMatch[2], 10);
    const num = parseInt(target, 10);
    return isNaN(num) ? null : num;
  }

  const parsedTarget = parseTarget(member.annualCaseStartsTarget ?? null);
  const progressPct = parsedTarget && parsedTarget > 0 ? Math.min(Math.round((ytdTotal / parsedTarget) * 100), 100) : null;

  // Build activity rows for the roadmap
  function findDeliverable(name: string) {
    return deliverables.find((d) => d.name === name);
  }

  const roadmapSections: ActivitySection[] = [];

  // Helper: resolve roadmap items for a deliverable, using planned month overrides when set
  const currentMonth = new Date().getMonth() + 1; // 1-indexed

  type RoadmapDef = { name: string; fixed?: number; fixedMonths?: number[]; plannable?: boolean; multiPlannable?: boolean; autoComplete?: boolean };
  function resolveItems(def: RoadmapDef) {
    const d = findDeliverable(def.name);
    if (!d) return null;
    let items: ReturnType<typeof fixedMonthsItems>;
    if (def.multiPlannable) {
      const months = d.plannedMonths ?? [];
      if (months.length > 0) {
        items = fixedMonthsItems(d.name, months, d.completions.length);
      } else {
        items = def.fixedMonths
          ? fixedMonthsItems(d.name, def.fixedMonths.slice(0, d.annualAllocation), d.completions.length)
          : distributeAcrossYear(d.name, d.annualAllocation, d.completions.length);
      }
    } else if (def.plannable && d.plannedMonth) {
      items = [fixedMonthItem(d.name, d.plannedMonth, d.completions.length > 0)];
    } else if (def.plannable && !d.plannedMonth && !def.fixed && !def.fixedMonths) {
      items = [];
    } else {
      items = def.fixedMonths
        ? fixedMonthsItems(d.name, def.fixedMonths.slice(0, d.annualAllocation), d.completions.length)
        : def.fixed !== undefined
          ? [fixedMonthItem(d.name, d.plannedMonth ?? def.fixed, d.completions.length > 0)]
          : distributeAcrossYear(d.name, d.annualAllocation, d.completions.length);
    }
    // Auto-complete: mark items as completed once their month has passed
    if (def.autoComplete) {
      items = items.map((item) => ({ ...item, completed: item.month < currentMonth }));
    }
    return { label: d.name, items };
  }

  const digitalDefs: RoadmapDef[] = [
    { name: 'Annual In-Practice Visit', plannable: true },
    { name: 'Strategic Reports', fixedMonths: [1, 4, 7, 10], autoComplete: true },
    { name: 'Strategic Meetings (Online)', fixedMonths: [2, 5, 8, 11] },
    { name: 'Promotion/Event Campaigns', multiPlannable: true },
    { name: 'Landing Pages', fixedMonths: [1, 4, 7, 10], multiPlannable: true },
  ];
  const digitalRows = digitalDefs.map(resolveItems).filter(Boolean) as ActivityRow[];
  // Add ongoing digital items (not deliverables — always present)
  digitalRows.push(
    { label: 'Website Maintenance Edits', items: [], ongoing: true },
    { label: 'Website Optimisation', items: [], ongoing: true },
    { label: 'Ads Optimisation', items: [], ongoing: true },
  );
  if (digitalRows.length > 0) {
    roadmapSections.push({ heading: 'Digital Activities', rows: digitalRows });
  }

  const consultingDefs: RoadmapDef[] = [
    { name: '12 Month Strategic Plan', fixed: 1 },
    { name: 'In-Practice 6 Month Strategic Plan Revisit', fixed: 7, plannable: true },
    { name: 'Online Consulting Hours' },
    { name: 'In-Practice Strategic Workshop', plannable: true },
    { name: 'Annual Benchmarking Report', fixed: 5, plannable: true },
    { name: 'Secret Shopper Calls', fixedMonths: [10, 3], plannable: true },
  ];
  const consultingRows = consultingDefs.map(resolveItems).filter(Boolean) as ActivityRow[];
  if (consultingRows.length > 0) {
    roadmapSections.push({ heading: 'Consulting Activities', rows: consultingRows });
  }

  // Events — region-specific
  if (member.region === 'UKI') {
    roadmapSections.push({
      heading: 'Events',
      rows: [
        { label: 'Content Creation Workshop', items: [fixedMonthItem('Content Creation Workshop', 5, false)], infoUrl: 'https://www.tioevents.com/events/content-workshop' },
        { label: 'TIO UKI Conference', items: [fixedMonthItem('TIO UKI Conference', 6, false)], infoUrl: 'https://www.tioevents.com/events/annual-conference-uk' },
        { label: 'Bondend PRM Workshop', items: [fixedMonthItem('Bondend PRM Workshop', 10, false)] },
      ],
    });
  }

  // Short month names for conversion rate display
  const shortMonths = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  // Compute lead-to-conversion rates for the last 6 months
  const recentPrm = [...prmCounts]
    .sort((a, b) => b.year - a.year || b.month - a.month)
    .slice(0, 6)
    .sort((a, b) => a.year - b.year || a.month - b.month);

  const caseStartLookup = new Map(
    allCaseStarts.map((s) => [`${s.year}-${s.month}`, s.caseStarts]),
  );

  const conversionData = recentPrm.map((prm) => {
    const caseStarts = caseStartLookup.get(`${prm.year}-${prm.month}`);
    const rate =
      caseStarts !== undefined && prm.contactCount > 0
        ? Math.round((caseStarts / prm.contactCount) * 100)
        : null;
    return {
      year: prm.year,
      month: prm.month,
      label: shortMonths[prm.month - 1],
      caseStarts: caseStarts ?? null,
      contacts: prm.contactCount,
      rate,
    };
  });

  const hasConversionData = conversionData.some((d) => d.rate !== null);

  // Find the most recent month missing a submission (scan backwards from previous month)
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const now = new Date();
  const prevMonth = now.getMonth(); // 0-indexed = previous month's 1-indexed value
  const submittedMonths = new Set(submissions.map((s) => s.month));
  let missingMonth: number | null = null;
  for (let m = prevMonth; m >= 1; m--) {
    if (!submittedMonths.has(m)) {
      missingMonth = m;
      break;
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy mb-2">
            Welcome, {member.name}
          </h1>
          <p className="text-gray-600">
            View your TIO dashboard and consulting reports.
          </p>
        </div>
        {member.logoUrl && (
          <img
            src={member.logoUrl}
            alt={`${member.name} logo`}
            className="h-12 w-auto object-contain"
          />
        )}
      </div>

      {/* Missing case starts alert */}
      {missingMonth !== null && (
        <Link
          href="/portal/case-starts"
          className="flex items-center gap-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg p-4 mb-8 hover:bg-amber-100 transition-colors"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">
            Your {monthNames[missingMonth - 1]} {currentYear} case starts haven&apos;t been submitted yet.{" "}
            <span className="underline">Submit now</span>
          </span>
        </Link>
      )}

      {/* Account Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-brand-navy mb-4">
          Account Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Email</div>
            <div className="text-sm text-brand-navy">{member.email}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Member Since</div>
            <div className="text-sm text-brand-navy">
              {format(member.memberSince ?? member.createdAt, "MMM d, yyyy")}
            </div>
          </div>
          {member.region && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Region</div>
              <div className="text-sm text-brand-navy">{member.region}</div>
            </div>
          )}
          {member.consultantName && (
            <div>
              <div className="text-xs text-gray-500 mb-1">Consultant</div>
              <div className="text-sm text-brand-navy">
                {member.consultantName}
              </div>
            </div>
          )}
          {member.digitalStrategistName && (
            <div>
              <div className="text-xs text-gray-500 mb-1">
                Digital Strategist
              </div>
              <div className="text-sm text-brand-navy">
                {member.digitalStrategistName}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Annual Case Starts Target + Progress */}
      {member.annualCaseStartsTarget && (
        <Link
          href="/portal/case-starts"
          className="block bg-brand-navy text-white rounded-lg shadow-sm p-6 mb-8 hover:opacity-95 transition-opacity"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-medium opacity-80">Annual Case Starts Target</div>
            {progressPct !== null && (
              <div className="text-sm font-medium opacity-80">
                {ytdTotal} / {parsedTarget} YTD
              </div>
            )}
          </div>
          <div className="text-2xl font-bold mb-3">{member.annualCaseStartsTarget}</div>
          {progressPct !== null && (
            <div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-green rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-sm mt-1 opacity-80">{progressPct}% of annual target</div>
            </div>
          )}
        </Link>
      )}

      {/* PRM Insights */}
      {prmCounts.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-navy">PRM Insights</h2>
          <RefreshPrmButton />
        </div>
      )}
      {prmCounts.length > 0 && (
        <PrmContactCounts
          counts={prmCounts.map((c) => ({
            id: c.id,
            year: c.year,
            month: c.month,
            contactCount: c.contactCount,
          }))}
        />
      )}

      {/* Lead to Conversion Rate */}
      {prmCounts.length > 0 && hasConversionData && (
        <>
          <h2 className="text-lg font-semibold text-brand-navy mb-4 flex items-center gap-2">
            Lead to Start Conversion Rate
            <span className="relative group">
              <svg className="w-4 h-4 text-gray-400 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 rounded-lg bg-gray-900 text-white text-xs leading-relaxed p-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                Your Lead to Start Rate is worked out from the total number of contacts added to your PRM for that month, and the number of Case Starts that you have submitted via this portal.
              </span>
            </span>
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
            <div className="grid grid-cols-6 divide-x divide-gray-100">
              {conversionData.map((d) => (
                <div key={`${d.year}-${d.month}`} className="p-4 text-center">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                    {d.label}
                  </p>
                  {d.rate !== null ? (
                    <>
                      <p className="text-2xl font-bold text-brand-navy leading-tight">
                        {d.rate}%
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {d.caseStarts} starts / {d.contacts} leads
                      </p>
                    </>
                  ) : (
                    <p className="text-lg text-gray-300">—</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Upcoming Meetings */}
      {isHubSpotConfigured() && member.hubspotCompanyId && (
        <>
          <h2 className="text-lg font-semibold text-brand-navy mb-4">
            Upcoming Meetings
          </h2>
          <div className="mb-8">
            <UpcomingMeetings meetings={upcomingMeetings} />
          </div>
        </>
      )}

      {/* Yearly Road-map */}
      <h2 className="text-lg font-semibold text-brand-navy mb-1">
        Yearly Road-map
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Your Yearly Road-map illustrates the key areas of focus we&apos;re working on together over this period.
      </p>
      <YearlyRoadmap
        focuses={quarterlyFocuses}
        activitySections={roadmapSections}
      />

      {/* Recent Reports — hidden for Tier 2 */}
      {session.user.portalTier !== 2 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-navy">
              Recent Reports
            </h2>
            <Link
              href="/portal/reports"
              className="text-sm text-brand-navy hover:underline"
            >
              View all reports
            </Link>
          </div>

          {member.reports.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No reports available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {member.reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/portal/reports/${report.id}`}
                  className="block p-5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-brand-blue transition-shadow"
                >
                  <h3 className="font-semibold text-brand-navy mb-1">
                    {format(report.reportMonth, "MMMM yyyy")}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>{report.emailCount} emails</span>
                    <span>{report.meetingCount} meetings</span>
                  </div>
                  {report.summary && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {report.summary}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
