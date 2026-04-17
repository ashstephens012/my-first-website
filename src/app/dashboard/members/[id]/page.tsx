/**
 * Individual Member Page
 * Shows member details and their reports
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import Protected from '@/components/Protected';
import { ReportCard } from '@/components/ReportCard';
import { getMemberWithReports } from '@/app/actions/members';
import DeleteMemberButton from '@/components/DeleteMemberButton';
import PortalLoginManager from '@/components/PortalLoginManager';
import CaseStartsManager from '@/components/CaseStartsManager';
import PrmContactCounts from '@/components/PrmContactCounts';

export const dynamic = 'force-dynamic';
import UpcomingMeetings from '@/components/UpcomingMeetings';
import { isHubSpotConfigured } from '@/lib/hubspot/client';
import { getUpcomingMeetings } from '@/lib/hubspot/fetchers';
import YearlyRoadmap, { distributeAcrossYear, fixedMonthItem, fixedMonthsItems } from '@/components/YearlyRoadmap';
import type { ActivitySection, ActivityRow } from '@/components/YearlyRoadmap';
import AdminRefreshPrmButton from '@/components/AdminRefreshPrmButton';
import QuarterlyFocusManager from '@/components/QuarterlyFocusManager';
import DeliverablesManager from '@/components/DeliverablesManager';
import AnnualTargetBar from '@/components/AnnualTargetBar';
import MarketingPlanGrid from '@/components/MarketingPlanGrid';
import MarketingPlanBuilder from '@/components/MarketingPlanBuilder';

export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { member } = await getMemberWithReports(id);

  if (!member) {
    notFound();
  }

  const upcomingMeetings =
    isHubSpotConfigured() && member.hubspotCompanyId
      ? await getUpcomingMeetings(member.hubspotCompanyId)
      : [];

  // Compute YTD progress for the target bar
  const currentYear = new Date().getFullYear();
  const ytdTotal = member.caseStartSubmissions
    .filter((s) => s.year === currentYear)
    .reduce((sum, s) => sum + s.caseStarts, 0);

  function parseTarget(target: string | null): number | null {
    if (!target) return null;
    const rangeMatch = target.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) return parseInt(rangeMatch[2], 10);
    const num = parseInt(target, 10);
    return isNaN(num) ? null : num;
  }

  const parsedTarget = parseTarget(member.annualCaseStartsTarget ?? null);
  const progressPct = parsedTarget && parsedTarget > 0 ? Math.min(Math.round((ytdTotal / parsedTarget) * 100), 100) : null;

  // Build activity rows for the roadmap from deliverables
  const currentYearDeliverables = member.deliverables.filter((d) => d.year === currentYear);
  function findDeliverable(name: string) {
    return currentYearDeliverables.find((d) => d.name === name);
  }

  const roadmapSections: ActivitySection[] = [];

  // Helper: resolve roadmap items for a deliverable, using planned month overrides when set
  const currentMonth = new Date().getMonth() + 1; // 1-indexed

  type RoadmapDef = { name: string; fixed?: number; fixedMonths?: number[]; plannable?: boolean; multiPlannable?: boolean; autoComplete?: boolean };
  function resolveItems(def: RoadmapDef) {
    const d = findDeliverable(def.name);
    if (!d) return null;
    let items: ReturnType<typeof fixedMonthsItems>;
    // Multi-plannable: use plannedMonths array, fall back to distributed
    if (def.multiPlannable) {
      const months = d.plannedMonths ?? [];
      if (months.length > 0) {
        items = fixedMonthsItems(d.name, months, d.completions.length);
      } else {
        // Fall back to fixedMonths defaults if provided, otherwise distribute evenly
        items = def.fixedMonths
          ? fixedMonthsItems(d.name, def.fixedMonths.slice(0, d.annualAllocation), d.completions.length)
          : distributeAcrossYear(d.name, d.annualAllocation, d.completions.length);
      }
    } else if (def.plannable && d.plannedMonth) {
      // Single plannable with a plannedMonth set — use it as override
      items = [fixedMonthItem(d.name, d.plannedMonth, d.completions.length > 0)];
    } else if (def.plannable && !d.plannedMonth && !def.fixed && !def.fixedMonths) {
      // Plannable with no plannedMonth and no default — show empty row
      items = [];
    } else {
      // Default placement
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

  // Digital Activities
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

  // Consulting Activities
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

  return (
    <Protected>
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link
            href="/dashboard/members"
            className="text-brand-navy hover:text-brand-navy/70"
          >
            Members
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">{member.name}</span>
        </nav>

        {/* Member Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-navy">
                {member.name}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  member.status === 'active'
                    ? 'bg-brand-green/40 text-brand-navy'
                    : member.status === 'onboarding'
                    ? 'bg-blue-100 text-blue-800'
                    : member.status === 'notice_given'
                    ? 'bg-amber-100 text-amber-800'
                    : member.status === 'offboarding'
                    ? 'bg-orange-100 text-orange-800'
                    : member.status === 'previous_member'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {member.status.replace('_', ' ')}
              </div>
              <Link
                href={`/dashboard/members/${member.id}/edit`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Edit
              </Link>
              <DeleteMemberButton memberId={member.id} memberName={member.name} />
            </div>
          </div>

          <h3 className="mt-6 text-sm font-semibold text-brand-navy">Key Member Information</h3>
          <div className="mt-3 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Member Since</div>
              <div className="text-sm text-brand-navy">
                {format(member.memberSince ?? member.createdAt, 'MMM d, yyyy')}
              </div>
            </div>
            {member.membershipTier && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Membership Tier</div>
                <div className="text-sm text-brand-navy">{member.membershipTier}</div>
              </div>
            )}
            {member.region && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Region</div>
                <div className="text-sm text-brand-navy">{member.region}</div>
              </div>
            )}
          </div>

          {/* Row 2: Consultant, Digital Strategist */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            {member.consultantName && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Consultant</div>
                <div className="text-sm text-brand-navy">{member.consultantName}</div>
              </div>
            )}
            {member.digitalStrategistName && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Digital Strategist</div>
                <div className="text-sm text-brand-navy">{member.digitalStrategistName}</div>
              </div>
            )}
          </div>

          <hr className="mt-5 border-gray-200" />
          <h3 className="mt-4 text-sm font-semibold text-brand-navy">Additional Information</h3>
          <div className="mt-3 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">HubSpot Company ID</div>
              <div className="text-sm font-mono text-brand-navy">
                {member.hubspotCompanyId}
              </div>
            </div>
            {member.websiteUrl && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Website</div>
                <a
                  href={member.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-navy hover:underline"
                >
                  {member.websiteUrl.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            {member.logoUrl && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Logo</div>
                <div className={`h-10 w-10 rounded flex items-center justify-center ${member.logoUrl.includes('logo-white') ? 'bg-gray-900' : ''}`}>
                  <img
                    src={member.logoUrl}
                    alt={`${member.name} logo`}
                    className="h-10 w-10 object-contain rounded"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Portal Login Status */}
          <PortalLoginManager
            memberId={member.id}
            memberName={member.name}
            users={member.users}
          />
        </div>

        {/* Member Case Starts Section */}
        <div className="bg-brand-blue/20 rounded-lg shadow-sm border border-brand-blue/40 p-6 mb-8">
          <h2 className="text-2xl font-bold text-brand-navy mb-4">Member Case Starts</h2>
          <hr className="border-brand-blue/40 mb-6" />

          {/* Annual Case Starts Target */}
          {!member.annualCaseStartsTarget && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              <svg className="h-5 w-5 shrink-0 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Annual case starts target has not been set for this member. Click the target bar below to set it.</span>
            </div>
          )}
          <AnnualTargetBar
            memberId={member.id}
            annualCaseStartsTarget={member.annualCaseStartsTarget}
            ytdTotal={ytdTotal}
            parsedTarget={parsedTarget}
            progressPct={progressPct}
          />

          {/* Case Starts */}
          <CaseStartsManager
            memberId={member.id}
            submissions={member.caseStartSubmissions.map((s) => ({
              id: s.id,
              year: s.year,
              month: s.month,
              caseStarts: s.caseStarts,
            }))}
          />
        </div>

        {/* PRM Information Section */}
        {member.allClientsAccountId && member.allClientsApiKey && (
          <div className="bg-brand-blue/20 rounded-lg shadow-sm border border-brand-blue/40 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-brand-navy">PRM Information</h2>
              <AdminRefreshPrmButton memberId={member.id} />
            </div>
            <hr className="border-brand-blue/40 mb-6" />
            <PrmContactCounts
              counts={member.prmContactCounts.map((c) => ({
                id: c.id,
                year: c.year,
                month: c.month,
                contactCount: c.contactCount,
              }))}
            />
          </div>
        )}

        {/* Member Management Section */}
        <div className="bg-brand-blue/20 rounded-lg shadow-sm border border-brand-blue/40 p-6 mb-8">
          <h2 className="text-2xl font-bold text-brand-navy mb-4">Member Management</h2>
          <hr className="border-brand-blue/40 mb-6" />

          {/* Yearly Road-map */}
          <h3 className="text-lg font-semibold text-brand-navy mb-1">
            Yearly Road-map
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Your Yearly Road-map illustrates the key areas of focus we&apos;re working on together over this period.
          </p>
          <YearlyRoadmap
            focuses={member.quarterlyFocuses
              .filter((f) => f.year === currentYear)
              .map((f) => ({ quarter: f.quarter, focus: f.focus }))}
            activitySections={roadmapSections}
          />

          <QuarterlyFocusManager
            memberId={member.id}
            year={currentYear}
            focuses={member.quarterlyFocuses
              .filter((f) => f.year === currentYear)
              .map((f) => ({ id: f.id, quarter: f.quarter, focus: f.focus }))}
          />

          {/* Deliverables Tracker */}
          {currentYearDeliverables.length === 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              <svg className="h-5 w-5 shrink-0 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{currentYear} deliverables have not been initialised for this member.</span>
            </div>
          )}
          <DeliverablesManager
            memberId={member.id}
            membershipTier={member.membershipTier ?? null}
            isAdmin
            deliverables={member.deliverables.map((d) => ({
              id: d.id,
              year: d.year,
              category: d.category,
              name: d.name,
              annualAllocation: d.annualAllocation,
              plannedMonth: d.plannedMonth,
              plannedMonths: d.plannedMonths ?? [],
              completions: d.completions.map((c) => ({
                id: c.id,
                completedAt: c.completedAt.toISOString(),
                notes: c.notes,
              })),
            }))}
          />
        </div>

        {/* Marketing Plan Section */}
        {(() => {
          const marketingPlan = member.marketingPlans?.find((p) => p.year === currentYear) ?? null;
          return (
            <div className="bg-brand-blue/20 rounded-lg shadow-sm border border-brand-blue/40 p-6 mb-8">
              <h2 className="text-2xl font-bold text-brand-navy mb-4">12-Month Strategic Marketing Plan</h2>
              <hr className="border-brand-blue/40 mb-6" />
              {marketingPlan && (
                <div className="mb-6">
                  <MarketingPlanGrid plan={marketingPlan} />
                </div>
              )}
              <MarketingPlanBuilder
                memberId={member.id}
                membershipTier={member.membershipTier ?? null}
                plan={marketingPlan}
              />
            </div>
          );
        })()}

        {/* Upcoming Meetings */}
        {isHubSpotConfigured() && member.hubspotCompanyId && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-brand-navy mb-4">
              Upcoming Meetings
            </h2>
            <UpcomingMeetings meetings={upcomingMeetings} />
          </div>
        )}

        {/* Generate Report Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-brand-navy">Reports</h2>
          <Link
            href={`/dashboard/reports/generate?memberId=${member.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-navy hover:opacity-90"
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
            Generate Consulting Report
          </Link>
        </div>

        {/* Reports List */}
        {member.reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
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
              Generate a monthly report to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {member.reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </Protected>
  );
}
