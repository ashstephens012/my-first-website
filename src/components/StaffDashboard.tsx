'use client';

import Link from 'next/link';
import { MemberCard } from '@/components/MemberCard';
import type { StaffMember, StaffMembersResult } from '@/lib/staff/queries';

const ROLE_LABELS = {
  consultant: 'Consultant',
  strategist: 'Digital Strategist',
  both: 'Consultant & Digital Strategist',
} as const;

const RELATION_LABELS = {
  consultant: 'Consultant',
  strategist: 'Strategist',
  both: 'Consultant & Strategist',
} as const;

interface StaffDashboardProps {
  userName: string;
  members: StaffMember[];
  staffRole: NonNullable<StaffMembersResult['staffRole']>;
}

/**
 * Returns the "missing" items relevant to this staff user for a given member.
 * A consultant only sees consultant gaps; a strategist only sees strategist gaps.
 * A user who is both sees whichever side(s) they own for that member.
 */
function getMissing(member: StaffMember): string[] {
  const missing: string[] = [];
  if (member.staffRelation === 'consultant' || member.staffRelation === 'both') {
    missing.push(...member.consultantMissing);
  }
  if (member.staffRelation === 'strategist' || member.staffRelation === 'both') {
    missing.push(...member.strategistMissing);
  }
  return missing;
}

/** Is this member fully initialised from the perspective of this staff user? */
function isInitialisedForUser(member: StaffMember): boolean {
  return getMissing(member).length === 0;
}

export default function StaffDashboard({ userName, members, staffRole }: StaffDashboardProps) {
  const total = members.length;
  const initialisedCount = members.filter(isInitialisedForUser).length;
  const needsAttention = members.filter((m) => !isInitialisedForUser(m));
  const needsAttentionCount = needsAttention.length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">Your Members</h1>
          <p className="mt-2 text-gray-600">
            {userName} — {ROLE_LABELS[staffRole]}
          </p>
        </div>
        <Link
          href="/dashboard/member-management"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-brand-navy/90 transition-colors"
        >
          Member Management
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Members</div>
          <div className="text-2xl font-bold text-brand-navy">{total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">
            {new Date().getFullYear()} Initialised
          </div>
          <div className="text-2xl font-bold text-brand-navy">
            {initialisedCount} / {total}
          </div>
        </div>
        <div
          className={`bg-white rounded-xl shadow-sm p-5 border ${
            needsAttentionCount > 0 ? 'border-orange-300' : 'border-gray-200'
          }`}
        >
          <div className="text-sm font-medium text-gray-500 mb-1">Needs Attention</div>
          <div
            className={`text-2xl font-bold ${
              needsAttentionCount > 0 ? 'text-orange-600' : 'text-brand-navy'
            }`}
          >
            {needsAttentionCount}
          </div>
        </div>
      </div>

      {/* Needs Attention section */}
      {needsAttention.length > 0 && (
        <div className="mb-8 bg-orange-50 border border-orange-200 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-orange-800 mb-3">Needs Attention</h2>
          <p className="text-sm text-orange-700 mb-4">
            These members still need your {new Date().getFullYear()} setup completing.
          </p>
          <ul className="space-y-2">
            {needsAttention.map((m) => {
              const missing = getMissing(m);
              return (
                <li key={m.id}>
                  <Link
                    href={`/dashboard/members/${m.id}`}
                    className="inline-flex items-center gap-2 text-orange-900 hover:text-orange-700 hover:underline font-medium text-sm"
                  >
                    <span>{m.name}</span>
                    {missing.length > 0 && (
                      <span className="text-xs font-normal text-orange-600">
                        — missing {missing.join(', ')}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Member grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div key={member.id} className="relative">
            <MemberCard member={member} isInitialised={isInitialisedForUser(member)} />
            {/* Relationship badge */}
            <span
              className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium ${
                member.staffRelation === 'consultant'
                  ? 'bg-blue-100 text-blue-800'
                  : member.staffRelation === 'strategist'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {RELATION_LABELS[member.staffRelation]}
            </span>
          </div>
        ))}
      </div>

      {/* Footer link */}
      <div className="mt-8 text-center">
        <Link
          href="/dashboard/members"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-navy hover:underline"
        >
          View all members
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
