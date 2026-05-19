'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type {
  MemberManagementRow,
  StaffMemberManagementResult,
} from '@/lib/staff/queries';

const ROLE_LABELS = {
  consultant: 'Consultant',
  strategist: 'Digital Strategist',
  both: 'Consultant & Digital Strategist',
} as const;

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

type FilterMode = 'all' | 'attention' | 'uptodate';
type SortMode = 'outstanding' | 'name-asc' | 'name-desc';

interface MemberManagementProps {
  userName: string;
  members: MemberManagementRow[];
  staffRole: NonNullable<StaffMemberManagementResult['staffRole']>;
  currentMonth: number;
  currentYear: number;
}

function SeverityIcon({ severity }: { severity: 'critical' | 'warning' | 'info' }) {
  if (severity === 'critical') {
    return (
      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  }
  if (severity === 'warning') {
    return (
      <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );
}

export default function MemberManagement({
  userName,
  members,
  staffRole,
  currentMonth,
  currentYear,
}: MemberManagementProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortMode>('outstanding');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let result = [...members];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }

    // Filter
    if (filter === 'attention') {
      result = result.filter((m) => m.outstandingCount > 0);
    } else if (filter === 'uptodate') {
      result = result.filter((m) => m.outstandingCount === 0);
    }

    // Sort
    if (sort === 'outstanding') {
      result.sort((a, b) => b.outstandingCount - a.outstandingCount);
    } else if (sort === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [members, search, filter, sort]);

  // Stats
  const totalMembers = members.length;
  const totalOutstanding = members.reduce((sum, m) => sum + m.outstandingCount, 0);
  const membersNeedingAttention = members.filter((m) => m.outstandingCount > 0).length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">My Member Management</h1>
          <p className="mt-2 text-gray-600">
            {userName} — {ROLE_LABELS[staffRole]}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-brand-navy hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Members</div>
          <div className="text-2xl font-bold text-brand-navy">{totalMembers}</div>
        </div>
        <div
          className={`bg-white rounded-xl shadow-sm p-5 border ${
            totalOutstanding > 0 ? 'border-orange-300' : 'border-gray-200'
          }`}
        >
          <div className="text-sm font-medium text-gray-500 mb-1">Outstanding Actions</div>
          <div
            className={`text-2xl font-bold ${
              totalOutstanding > 0 ? 'text-orange-600' : 'text-brand-navy'
            }`}
          >
            {totalOutstanding}
          </div>
        </div>
        <div
          className={`bg-white rounded-xl shadow-sm p-5 border ${
            membersNeedingAttention > 0 ? 'border-red-300' : 'border-gray-200'
          }`}
        >
          <div className="text-sm font-medium text-gray-500 mb-1">Members Needing Attention</div>
          <div
            className={`text-2xl font-bold ${
              membersNeedingAttention > 0 ? 'text-red-600' : 'text-brand-navy'
            }`}
          >
            {membersNeedingAttention}
          </div>
        </div>
      </div>

      {/* Filter / search bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by member name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterMode)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/30"
        >
          <option value="all">All Members</option>
          <option value="attention">Needs Attention</option>
          <option value="uptodate">Up to Date</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/30"
        >
          <option value="outstanding">Most Outstanding First</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div>Member</div>
          <div>Status</div>
          <div>Outstanding</div>
          <div>Case Starts</div>
          <div>Deliverables</div>
          <div />
        </div>

        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-gray-400">
            No members match your filters.
          </div>
        )}

        {filtered.map((member) => {
          const isExpanded = expandedIds.has(member.id);
          const submittedMonths = new Set(member.caseStartSubmissions.map((s) => s.month));
          const caseStartsPastMonths = currentMonth - 1;
          const caseStartsSubmitted = member.caseStartSubmissions.filter(
            (s) => s.month < currentMonth,
          ).length;
          const totalDeliverables = member.deliverables.length;
          const completedDeliverables = member.deliverables.filter(
            (d) => d.completions.length >= d.annualAllocation,
          ).length;

          const hasCritical = member.outstandingItems.some((i) => i.severity === 'critical');
          const hasWarning = member.outstandingItems.some((i) => i.severity === 'warning');

          const badgeClass =
            member.outstandingCount === 0
              ? 'bg-brand-green/40 text-brand-navy'
              : hasCritical
              ? 'bg-red-100 text-red-800'
              : hasWarning
              ? 'bg-orange-100 text-orange-800'
              : 'bg-blue-100 text-blue-800';

          return (
            <div key={member.id} className="border-b border-gray-100 last:border-0">
              {/* Main row */}
              <div
                className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-5 py-4 items-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(member.id)}
              >
                {/* Member */}
                <div className="flex items-center gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/members/${member.id}`}
                      className="text-sm font-semibold text-brand-navy hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {member.name}
                    </Link>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {member.region && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-brand-blue/20 text-brand-navy">
                          {member.region}
                        </span>
                      )}
                      {member.membershipTier && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {member.membershipTier}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'active'
                        ? 'bg-brand-green/40 text-brand-navy'
                        : member.status === 'onboarding'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                {/* Outstanding */}
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}
                  >
                    {member.outstandingCount}
                  </span>
                </div>

                {/* Case Starts */}
                <div>
                  <div className="text-sm text-gray-700">
                    {caseStartsSubmitted}/{caseStartsPastMonths} months
                  </div>
                  {caseStartsPastMonths > 0 && (
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-brand-navy rounded-full h-1.5 transition-all"
                        style={{
                          width: `${Math.round(
                            (caseStartsSubmitted / caseStartsPastMonths) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Deliverables */}
                <div className="text-sm text-gray-700">
                  {completedDeliverables}/{totalDeliverables}
                </div>

                {/* Chevron */}
                <div className="flex justify-center">
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded detail row */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-5 bg-gray-50/50">
                  {/* Outstanding items */}
                  {member.outstandingItems.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Outstanding Items
                      </h4>
                      <ul className="space-y-1.5">
                        {member.outstandingItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <SeverityIcon severity={item.severity} />
                            <Link
                              href={`/dashboard/members/${member.id}`}
                              className="text-sm text-gray-700 hover:text-brand-navy hover:underline"
                            >
                              <span className="font-medium">{item.label}</span>
                              {item.detail && (
                                <span className="text-gray-500"> — {item.detail}</span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Case starts mini grid */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Case Starts — {currentYear}
                    </h4>
                    <div className="grid grid-cols-12 gap-1">
                      {MONTH_LABELS.map((label, i) => {
                        const monthNum = i + 1;
                        const submission = member.caseStartSubmissions.find(
                          (s) => s.month === monthNum,
                        );
                        const isPast = monthNum < currentMonth;
                        const isCurrent = monthNum === currentMonth;

                        let cellClass = 'bg-gray-100 text-gray-400'; // future
                        let content = label;
                        if (submission) {
                          cellClass = 'bg-brand-green/40 text-brand-navy font-semibold';
                          content = String(submission.caseStarts);
                        } else if (isPast) {
                          cellClass = 'bg-red-100 text-red-700 font-semibold';
                          content = '—';
                        } else if (isCurrent) {
                          cellClass = 'bg-yellow-50 text-yellow-700';
                        }

                        return (
                          <div
                            key={monthNum}
                            className={`flex flex-col items-center rounded-lg py-1.5 text-xs ${cellClass}`}
                          >
                            <span className="text-[10px] opacity-70">{label}</span>
                            <span>{content}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Deliverables summary */}
                  {member.deliverables.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Deliverables — {currentYear}
                      </h4>
                      <div className="space-y-3">
                        {/* Group by category */}
                        {Object.entries(
                          member.deliverables.reduce<
                            Record<string, typeof member.deliverables>
                          >((acc, d) => {
                            (acc[d.category] ??= []).push(d);
                            return acc;
                          }, {}),
                        ).map(([category, deliverables]) => (
                          <div key={category}>
                            <div className="text-xs font-medium text-gray-600 mb-1">
                              {category}
                            </div>
                            <div className="space-y-1">
                              {deliverables.map((d) => {
                                const completed = d.completions.length;
                                const total = d.annualAllocation;
                                const ratio = total > 0 ? completed / total : 0;
                                const indicatorClass =
                                  ratio >= 1
                                    ? 'bg-green-500'
                                    : ratio > 0
                                    ? 'bg-orange-400'
                                    : 'bg-red-400';

                                return (
                                  <div
                                    key={d.id}
                                    className="flex items-center gap-3 text-sm"
                                  >
                                    <span
                                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${indicatorClass}`}
                                    />
                                    <span className="text-gray-700 flex-1 truncate">
                                      {d.name}
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      {completed}/{total}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View full member page */}
                  <div>
                    <Link
                      href={`/dashboard/members/${member.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-brand-navy/90 transition-colors"
                    >
                      View Full Member Page
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
