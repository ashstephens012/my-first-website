'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deletePerformanceReport } from '@/app/actions/performance-reports';

interface PerformanceReportActionsProps {
  reportId: string;
}

export default function PerformanceReportActions({
  reportId,
}: PerformanceReportActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this performance report?')) return;
    setDeleting(true);
    await deletePerformanceReport(reportId);
    router.push('/dashboard/performance');
  }

  return (
    <div className="flex items-center gap-3 mt-4">
      <a
        href={`/api/performance-reports/${reportId}/pdf`}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download PDF
      </a>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
      >
        {deleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  );
}
