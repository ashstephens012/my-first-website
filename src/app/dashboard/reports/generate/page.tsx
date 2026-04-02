/**
 * Generate Report Page
 * Manual report generation interface
 */

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Protected from '@/components/Protected';
import { getMembers } from '@/app/actions/members';
import { generateReport } from '@/app/actions/reports';

function GenerateReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedMemberId = searchParams.get('memberId');

  const [members, setMembers] = useState<any[]>([]);
  const [memberId, setMemberId] = useState(preselectedMemberId || '');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMembers() {
      const result = await getMembers();
      if (result.success) {
        setMembers(result.members);
      }
    }
    loadMembers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsGenerating(true);

    try {
      const result = await generateReport(memberId, year, month);

      if (result.success) {
        router.push(`/dashboard/reports/${result.reportId}`);
      } else {
        setError(result.error || 'Failed to generate report');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <Protected>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-brand-navy mb-8">
          Generate Monthly Report
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Member Select */}
            <div>
              <label
                htmlFor="member"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Member
              </label>
              <select
                id="member"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-navy focus:border-brand-navy"
              >
                <option value="">Choose a member...</option>
                {members
                  .filter((m) => m.status === 'active')
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
              </select>
            </div>

            {/* Year and Month */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="year"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Year
                </label>
                <select
                  id="year"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-navy focus:border-brand-navy"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="month"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Month
                </label>
                <select
                  id="month"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-navy focus:border-brand-navy"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Info Message */}
            <div className="bg-brand-blue/20 border border-brand-blue text-brand-navy px-4 py-3 rounded-md text-sm">
              <p className="font-medium mb-1">What happens next:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Fetch emails and meetings from HubSpot</li>
                <li>Generate AI summaries for each activity</li>
                <li>Create executive summary</li>
                <li>Save report as draft for review</li>
              </ul>
              <p className="mt-2 text-xs">
                This process may take 1-2 minutes depending on activity volume.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating || !memberId}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-navy hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-navy disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Protected>
  );
}

export default function GenerateReportPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-8 px-4">Loading...</div>}>
      <GenerateReportForm />
    </Suspense>
  );
}
