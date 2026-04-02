import Protected from '@/components/Protected';
import {
  getLeadershipOverviewByRegion,
  getMonthlyCaseStartsTrend,
  getMonthlyReportsTrend,
  getMonthlyPrmTrend,
  getRegionBreakdown,
} from '@/lib/leadership/queries';
import LeadershipCharts from '@/components/leadership/LeadershipCharts';

export const dynamic = 'force-dynamic';

export default async function LeadershipPage() {
  const [overviewByRegion, caseStartsTrendByRegion, reportsTrendByRegion, prmTrendByRegion, regionBreakdown] =
    await Promise.all([
      getLeadershipOverviewByRegion(),
      getMonthlyCaseStartsTrend(),
      getMonthlyReportsTrend(),
      getMonthlyPrmTrend(),
      getRegionBreakdown(),
    ]);

  // Aggregate overview across all regions
  const overview = overviewByRegion.reduce(
    (acc, r) => ({
      activeMembers: acc.activeMembers + r.activeMembers,
      totalMembers: acc.totalMembers + r.totalMembers,
      totalReports: acc.totalReports + r.totalReports,
      sentReports: acc.sentReports + r.sentReports,
      draftReports: acc.draftReports + r.draftReports,
      reviewedReports: acc.reviewedReports + r.reviewedReports,
      ytdCaseStarts: acc.ytdCaseStarts + r.ytdCaseStarts,
      ytdPrmContacts: acc.ytdPrmContacts + r.ytdPrmContacts,
    }),
    { activeMembers: 0, totalMembers: 0, totalReports: 0, sentReports: 0, draftReports: 0, reviewedReports: 0, ytdCaseStarts: 0, ytdPrmContacts: 0 },
  );

  // Collapse region dimension for chart data
  const caseStartsTrend = Object.values(
    caseStartsTrendByRegion.reduce<Record<string, { month: string; caseStarts: number }>>((acc, p) => {
      acc[p.month] = acc[p.month] ?? { month: p.month, caseStarts: 0 };
      acc[p.month].caseStarts += p.caseStarts;
      return acc;
    }, {}),
  ).sort((a, b) => a.month.localeCompare(b.month));

  const reportsTrend = Object.values(
    reportsTrendByRegion.reduce<Record<string, { month: string; draft: number; reviewed: number; sent: number }>>((acc, p) => {
      acc[p.month] = acc[p.month] ?? { month: p.month, draft: 0, reviewed: 0, sent: 0 };
      acc[p.month].draft += p.draft;
      acc[p.month].reviewed += p.reviewed;
      acc[p.month].sent += p.sent;
      return acc;
    }, {}),
  ).sort((a, b) => a.month.localeCompare(b.month));

  const prmTrend = Object.values(
    prmTrendByRegion.reduce<Record<string, { month: string; contacts: number }>>((acc, p) => {
      acc[p.month] = acc[p.month] ?? { month: p.month, contacts: 0 };
      acc[p.month].contacts += p.contacts;
      return acc;
    }, {}),
  ).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <Protected>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-navy">Leadership Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Aggregated overview across all members
          </p>
        </div>

        {/* Stat cards — row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Active Members</div>
            <div className="text-2xl font-bold text-brand-navy">{overview.activeMembers}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Reports</div>
            <div className="text-2xl font-bold text-brand-navy">{overview.totalReports}</div>
          </div>
          <div className="rounded-xl shadow-sm p-5 bg-brand-green/30 border border-brand-green">
            <div className="text-sm font-medium text-brand-navy mb-1">Reports Sent</div>
            <div className="text-2xl font-bold text-brand-navy">{overview.sentReports}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">YTD Case Starts</div>
            <div className="text-2xl font-bold text-brand-navy">{overview.ytdCaseStarts}</div>
          </div>
        </div>

        {/* Stat cards — row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl shadow-sm p-5 bg-brand-orange/20 border border-brand-orange">
            <div className="text-sm font-medium text-brand-navy mb-1">Reports Draft</div>
            <div className="text-2xl font-bold text-brand-navy">{overview.draftReports}</div>
          </div>
          <div className="rounded-xl shadow-sm p-5 bg-brand-blue/30 border border-brand-blue">
            <div className="text-sm font-medium text-brand-navy mb-1">Reports Reviewed</div>
            <div className="text-2xl font-bold text-brand-navy">{overview.reviewedReports}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">YTD PRM Contacts</div>
            <div className="text-2xl font-bold text-brand-navy">{overview.ytdPrmContacts}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Members</div>
            <div className="text-2xl font-bold text-brand-navy">{overview.totalMembers}</div>
          </div>
        </div>

        {/* Charts */}
        <LeadershipCharts
          caseStartsTrend={caseStartsTrend}
          reportsTrend={reportsTrend}
          prmTrend={prmTrend}
          regionBreakdown={regionBreakdown}
        />
      </div>
    </Protected>
  );
}
