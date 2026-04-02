import Protected from '@/components/Protected';
import {
  getLeadershipOverview,
  getMonthlyCaseStartsTrend,
  getMonthlyReportsTrend,
  getMonthlyPrmTrend,
  getRegionBreakdown,
} from '@/lib/leadership/queries';
import LeadershipCharts from '@/components/leadership/LeadershipCharts';

export const dynamic = 'force-dynamic';

export default async function LeadershipPage() {
  const [overview, caseStartsTrend, reportsTrend, prmTrend, regionBreakdown] =
    await Promise.all([
      getLeadershipOverview(),
      getMonthlyCaseStartsTrend(),
      getMonthlyReportsTrend(),
      getMonthlyPrmTrend(),
      getRegionBreakdown(),
    ]);

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
