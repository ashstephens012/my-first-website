'use client';

import { useState } from 'react';
import { refreshPrmData } from '@/app/actions/prm';

export default function RefreshPrmButton() {
  const [refreshing, setRefreshing] = useState(false);

  async function handleClick() {
    setRefreshing(true);
    try {
      const result = await refreshPrmData();
      if (!result.success) {
        console.error('PRM refresh failed:', result.error);
      }
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={refreshing}
      title="Refresh PRM data"
      className="text-gray-400 hover:text-brand-navy transition-colors disabled:opacity-50"
    >
      <svg
        className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
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
    </button>
  );
}
