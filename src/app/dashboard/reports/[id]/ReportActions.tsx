/**
 * Report Actions Client Component
 * Handles status updates and PDF download
 */

'use client';

import { useState } from 'react';
import { updateStatus, removeReport } from '@/app/actions/reports';
import { useRouter } from 'next/navigation';

interface ReportActionsProps {
  reportId: string;
  currentStatus: string;
}

export function ReportActions({ reportId, currentStatus }: ReportActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusUpdate = async (
    newStatus: 'draft' | 'reviewed' | 'sent'
  ) => {
    setIsUpdating(true);
    try {
      const result = await updateStatus(reportId, newStatus);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Open PDF in new window
      window.open(`/api/reports/${reportId}/pdf`, '_blank');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this report? This cannot be undone.')) {
      return;
    }
    setIsDeleting(true);
    try {
      const result = await removeReport(reportId);
      if (result.success) {
        router.push('/dashboard/reports');
      } else {
        alert(result.error || 'Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Download PDF Button */}
      <button
        onClick={handleDownloadPDF}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Download PDF
      </button>

      {/* Status Update Buttons */}
      {currentStatus === 'draft' && (
        <button
          onClick={() => handleStatusUpdate('reviewed')}
          disabled={isUpdating}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-navy hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Updating...' : 'Mark as Reviewed'}
        </button>
      )}

      {currentStatus === 'reviewed' && (
        <button
          onClick={() => handleStatusUpdate('sent')}
          disabled={isUpdating}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-navy bg-brand-green hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Updating...' : 'Mark as Sent'}
        </button>
      )}

      {/* Delete Report Button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDeleting ? 'Deleting...' : 'Delete Report'}
      </button>
    </div>
  );
}
