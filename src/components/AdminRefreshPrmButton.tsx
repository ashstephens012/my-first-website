'use client';

import { useState } from 'react';
import { adminRefreshPrmData } from '@/app/actions/prm';

export default function AdminRefreshPrmButton({ memberId }: { memberId: string }) {
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setRefreshing(true);
    setMessage(null);
    try {
      const result = await adminRefreshPrmData(memberId);
      if (result.success) {
        setMessage('PRM data synced successfully');
      } else {
        setMessage(result.error ?? 'Sync failed');
      }
    } catch {
      setMessage('Sync failed');
    } finally {
      setRefreshing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={refreshing}
        className="inline-flex items-center px-3 py-1.5 border border-brand-navy rounded-md text-sm font-medium text-brand-navy bg-white hover:bg-brand-navy/5 disabled:opacity-50"
      >
        <svg
          className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {refreshing ? 'Syncing...' : 'Sync PRM Data'}
      </button>
      {message && (
        <span className="text-sm text-gray-600">{message}</span>
      )}
    </div>
  );
}
