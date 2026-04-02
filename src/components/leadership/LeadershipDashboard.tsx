'use client';

import { useState, useMemo } from 'react';
import LeadershipCharts from './LeadershipCharts';
import type {
  RegionOverview,
  RegionCaseStartsPoint,
  RegionReportsPoint,
  RegionPrmPoint,
} from '@/lib/leadership/queries';

interface Props {
  overviewByRegion: RegionOverview[];
  caseStartsTrend: RegionCaseStartsPoint[];
  reportsTrend: RegionReportsPoint[];
  prmTrend: RegionPrmPoint[];
  regionBreakdown: { region: string; count: number }[];
}

const EMPTY_OVERVIEW = {
  activeMembers: 0,
  totalMembers: 0,
  totalReports: 0,
  sentReports: 0,
  draftReports: 0,
  reviewedReports: 0,
  ytdCaseStarts: 0,
  ytdPrmContacts: 0,
};

export default function LeadershipDashboard({
  overviewByRegion,
  caseStartsTrend,
  reportsTrend,
  prmTrend,
  regionBreakdown,
}: Props) {
  const regions = useMemo(
    () => overviewByRegion.map((r) => r.region).sort(),
    [overviewByRegion],
  );

  const [selectedRegion, setSelectedRegion] = useState('Global');

  /* ── Aggregate overview stats ──────────────────────────────── */
  const overview = useMemo(() => {
    if (selectedRegion === 'Global') {
      return overviewByRegion.reduce(
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
        { ...EMPTY_OVERVIEW },
      );
    }
    return overviewByRegion.find((r) => r.region === selectedRegion) ?? { ...EMPTY_OVERVIEW };
  }, [overviewByRegion, selectedRegion]);

  /* ── Aggregate case-starts trend ───────────────────────────── */
  const filteredCaseStarts = useMemo(() => {
    const data =
      selectedRegion === 'Global'
        ? caseStartsTrend
        : caseStartsTrend.filter((p) => p.region === selectedRegion);

    const grouped = new Map<string, number>();
    for (const p of data) {
      grouped.set(p.month, (grouped.get(p.month) ?? 0) + p.caseStarts);
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, caseStarts]) => ({ month, caseStarts }));
  }, [caseStartsTrend, selectedRegion]);

  /* ── Aggregate reports trend ───────────────────────────────── */
  const filteredReports = useMemo(() => {
    const data =
      selectedRegion === 'Global'
        ? reportsTrend
        : reportsTrend.filter((p) => p.region === selectedRegion);

    const grouped = new Map<string, { draft: number; reviewed: number; sent: number }>();
    for (const p of data) {
      if (!grouped.has(p.month)) grouped.set(p.month, { draft: 0, reviewed: 0, sent: 0 });
      const e = grouped.get(p.month)!;
      e.draft += p.draft;
      e.reviewed += p.reviewed;
      e.sent += p.sent;
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, counts]) => ({ month, ...counts }));
  }, [reportsTrend, selectedRegion]);

  /* ── Aggregate PRM trend ───────────────────────────────────── */
  const filteredPrm = useMemo(() => {
    const data =
      selectedRegion === 'Global'
        ? prmTrend
        : prmTrend.filter((p) => p.region === selectedRegion);

    const grouped = new Map<string, number>();
    for (const p of data) {
      grouped.set(p.month, (grouped.get(p.month) ?? 0) + p.contacts);
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, contacts]) => ({ month, contacts }));
  }, [prmTrend, selectedRegion]);

  /* ── Region breakdown — always show full for pie chart ─────── */
  const filteredRegionBreakdown = useMemo(() => {
    if (selectedRegion === 'Global') return regionBreakdown;
    return regionBreakdown.filter((r) => r.region === selectedRegion);
  }, [regionBreakdown, selectedRegion]);

  return (
    <>
      {/* Region toggle */}
      {regions.length > 1 && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-medium text-gray-500 mr-1">Region:</span>
          {['Global', ...regions].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRegion(r)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedRegion === r
                  ? 'bg-brand-navy text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      )}

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
        caseStartsTrend={filteredCaseStarts}
        reportsTrend={filteredReports}
        prmTrend={filteredPrm}
        regionBreakdown={filteredRegionBreakdown}
      />
    </>
  );
}
