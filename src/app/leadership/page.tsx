import Protected from '@/components/Protected';
import {
  getLeadershipOverviewByRegion,
  getMonthlyCaseStartsTrend,
  getMonthlyReportsTrend,
  getMonthlyPrmTrend,
  getRegionBreakdown,
} from '@/lib/leadership/queries';
import LeadershipDashboard from '@/components/leadership/LeadershipDashboard';

export const dynamic = 'force-dynamic';

export default async function LeadershipPage() {
  const [overviewByRegion, caseStartsTrend, reportsTrend, prmTrend, regionBreakdown] =
    await Promise.all([
      getLeadershipOverviewByRegion(),
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

        <LeadershipDashboard
          overviewByRegion={overviewByRegion}
          caseStartsTrend={caseStartsTrend}
          reportsTrend={reportsTrend}
          prmTrend={prmTrend}
          regionBreakdown={regionBreakdown}
        />
      </div>
    </Protected>
  );
}
