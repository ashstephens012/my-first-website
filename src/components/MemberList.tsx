'use client';

import { useMemo, useState } from 'react';
import { MemberCard } from '@/components/MemberCard';
import type { Member } from '@prisma/client';

type MemberWithCount = Member & { _count?: { reports: number }; isInitialised?: boolean };

type SortOption = 'name-asc' | 'name-desc';

interface MemberListProps {
  members: MemberWithCount[];
}

export function MemberList({ members }: MemberListProps) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [consultantFilter, setConsultantFilter] = useState('all');
  const [strategistFilter, setStrategistFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [initFilter, setInitFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [sort, setSort] = useState<SortOption>('name-asc');

  const tiers = useMemo(() => {
    const names = new Set<string>();
    for (const m of members) {
      if (m.membershipTier) names.add(m.membershipTier);
    }
    return Array.from(names).sort();
  }, [members]);

  const consultants = useMemo(() => {
    const names = new Set<string>();
    for (const m of members) {
      if (m.consultantName) names.add(m.consultantName);
    }
    return Array.from(names).sort();
  }, [members]);

  const strategists = useMemo(() => {
    const names = new Set<string>();
    for (const m of members) {
      if (m.digitalStrategistName) names.add(m.digitalStrategistName);
    }
    return Array.from(names).sort();
  }, [members]);

  const hasActiveFilter =
    search !== '' ||
    tierFilter !== 'all' ||
    consultantFilter !== 'all' ||
    strategistFilter !== 'all' ||
    regionFilter !== 'all' ||
    initFilter !== 'all' ||
    sort !== 'name-asc';

  const filtered = useMemo(() => {
    let result = members;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q),
      );
    }

    if (tierFilter !== 'all') {
      result = result.filter((m) => m.membershipTier === tierFilter);
    }

    if (consultantFilter !== 'all') {
      result = result.filter((m) => m.consultantName === consultantFilter);
    }

    if (strategistFilter !== 'all') {
      result = result.filter(
        (m) => m.digitalStrategistName === strategistFilter,
      );
    }

    if (regionFilter !== 'all') {
      result = result.filter((m) => m.region === regionFilter);
    }

    if (initFilter !== 'all') {
      result = result.filter((m) =>
        initFilter === 'yes' ? m.isInitialised === true : m.isInitialised === false,
      );
    }

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
      }
    });

    return result;
  }, [members, search, tierFilter, consultantFilter, strategistFilter, regionFilter, initFilter, sort]);

  function clearFilters() {
    setSearch('');
    setTierFilter('all');
    setConsultantFilter('all');
    setStrategistFilter('all');
    setRegionFilter('all');
    setInitFilter('all');
    setSort('name-asc');
  }

  const selectClass =
    'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue';

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          {/* Membership Tier */}
          {tiers.length > 0 && (
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className={selectClass}
            >
              <option value="all">All Tiers</option>
              {tiers.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
          )}

          {/* Region */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className={selectClass}
          >
            <option value="all">All Regions</option>
            <option value="UKI">UKI</option>
            <option value="ANZ">ANZ</option>
          </select>

          {/* Consultant */}
          {consultants.length > 0 && (
            <select
              value={consultantFilter}
              onChange={(e) => setConsultantFilter(e.target.value)}
              className={selectClass}
            >
              <option value="all">All Consultants</option>
              {consultants.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}

          {/* Digital Strategist */}
          {strategists.length > 0 && (
            <select
              value={strategistFilter}
              onChange={(e) => setStrategistFilter(e.target.value)}
              className={selectClass}
            >
              <option value="all">All Strategists</option>
              {strategists.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}

          {/* Init Status */}
          <select
            value={initFilter}
            onChange={(e) => setInitFilter(e.target.value as 'all' | 'yes' | 'no')}
            className={selectClass}
          >
            <option value="all">All Status</option>
            <option value="yes">Initialised</option>
            <option value="no">Needs Initialising</option>
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className={selectClass}
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>
        </div>

        {/* Result count + clear */}
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>
            Showing {filtered.length} of {members.length} members
          </span>
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="text-brand-blue hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-brand-navy">
            No members match your filters
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 inline-flex items-center rounded-xl border border-transparent bg-brand-navy px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <MemberCard key={member.id} member={member} isInitialised={member.isInitialised} />
          ))}
        </div>
      )}
    </div>
  );
}
