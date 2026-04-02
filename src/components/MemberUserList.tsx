'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { removeMemberLogin } from '@/app/actions/members';

type MemberUser = {
  id: string;
  name: string | null;
  email: string | null;
  portalTier: number | null;
  jobTitle: string | null;
  memberId: string | null;
  member: { id: string; name: string } | null;
  hasPassword: boolean;
  createdAt: Date;
};

interface MemberUserListProps {
  users: MemberUser[];
  currentUserRole: string;
}

export default function MemberUserList({ users, currentUserRole }: MemberUserListProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.member?.name.toLowerCase().includes(q),
    );
  }, [users, search]);

  async function handleDelete(userId: string, memberId: string | null) {
    if (!memberId) return;
    setLoading(userId);
    const result = await removeMemberLogin(memberId, userId);
    if (!result.success) {
      alert(result.error ?? 'Failed to remove member login');
    }
    setLoading(null);
    setConfirmDeleteId(null);
  }

  return (
    <div>
      {/* Search */}
      {users.length > 5 && (
        <div className="mb-4">
          <div className="relative max-w-sm">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email or practice…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Practice</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-navy">
                  <div>{user.name || 'Unnamed'}</div>
                  {user.jobTitle && (
                    <div className="text-xs text-gray-400 font-normal">{user.jobTitle}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.member ? (
                    <Link
                      href={`/dashboard/members/${user.member.id}`}
                      className="text-brand-navy hover:underline"
                    >
                      {user.member.name}
                    </Link>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.portalTier === 1
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    Tier {user.portalTier ?? '—'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.hasPassword
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {user.hasPassword ? 'Active' : 'Pending setup'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  {confirmDeleteId === user.id ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="text-xs text-gray-500">Are you sure?</span>
                      <button
                        onClick={() => handleDelete(user.id, user.memberId)}
                        disabled={loading === user.id}
                        className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                      >
                        {loading === user.id ? 'Removing…' : 'Yes, remove'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(user.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  No member users match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
