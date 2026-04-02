/**
 * Member Card Component
 * Standalone block card for member grid layout
 */

import Link from 'next/link';

import type { Member } from '@prisma/client';

interface MemberCardProps {
  member: Member & { _count?: { reports: number } };
  isInitialised?: boolean;
}

export function MemberCard({ member, isInitialised }: MemberCardProps) {
  const reportCount = member._count?.reports || 0;
  const initials = member.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link
      href={`/dashboard/members/${member.id}`}
      className="group bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="flex items-center gap-3 mb-3">
        {member.logoUrl ? (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${member.logoUrl.includes('logo-white') ? 'bg-gray-900' : ''}`}>
            <img
              src={member.logoUrl}
              alt={member.name}
              className="w-10 h-10 rounded-lg object-contain"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-brand-blue/20 flex items-center justify-center text-sm font-semibold text-brand-navy">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-brand-navy truncate">
            {member.name}
          </h3>
          <p className="text-xs text-gray-500 truncate">{member.email}</p>
        </div>
      </div>

      {isInitialised === false && (
        <div className="mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Needs Initialising
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              member.status === 'active'
                ? 'bg-brand-green/40 text-brand-navy'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {member.status}
          </span>
          {member.region && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-blue/20 text-brand-navy">
              {member.region}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {reportCount} {reportCount === 1 ? 'report' : 'reports'}
        </span>
      </div>
    </Link>
  );
}
