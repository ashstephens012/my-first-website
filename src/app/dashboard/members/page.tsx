/**
 * Members Management Page
 * Lists all members in a card grid with stats
 */

import Link from 'next/link';
import Protected from '@/components/Protected';
import { MemberList } from '@/components/MemberList';
import { getMembers } from '@/app/actions/members';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const { members } = await getMembers();

  return (
    <Protected>
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy">Members</h1>
            <p className="mt-2 text-gray-600">
              Manage orthodontic practice members and their reports
            </p>
          </div>
          <Link
            href="/dashboard/members/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-navy hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy"
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
            Add Member
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">
              Total Members
            </div>
            <div className="text-2xl font-bold text-brand-navy">
              {members.length}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-1">
              {new Date().getFullYear()} Members Initialised
            </div>
            <div className="text-2xl font-bold text-brand-navy">
              {members.filter((m: any) => m.isInitialised).length} / {members.length}
            </div>
          </div>
        </div>

        {/* Members Grid */}
        {members.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-brand-navy">
              No members yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by adding your first orthodontic practice member.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/members/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-brand-navy hover:opacity-90"
              >
                Add Member
              </Link>
            </div>
          </div>
        ) : (
          <MemberList members={members} />
        )}
      </div>
    </Protected>
  );
}
