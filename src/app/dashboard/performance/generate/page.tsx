'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Protected from '@/components/Protected';
import Link from 'next/link';
import { generatePerformanceReportAction } from '@/app/actions/performance-reports';

interface MemberOption {
  id: string;
  name: string;
  hasConfig: boolean;
}

export default function GeneratePerformanceReportPage() {
  return (
    <Suspense fallback={
      <Protected>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Protected>
    }>
      <GenerateForm />
    </Suspense>
  );
}

function GenerateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedMemberId = searchParams.get('memberId');

  const [members, setMembers] = useState<MemberOption[]>([]);
  const [memberId, setMemberId] = useState(preselectedMemberId ?? '');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth()); // Previous month
  const [manualTxStarted, setManualTxStarted] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    // Fetch members with performance config
    fetch('/api/performance-reports/members')
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.members ?? []);
        setLoadingMembers(false);
      })
      .catch(() => setLoadingMembers(false));
  }, []);

  async function handleGenerate() {
    if (!memberId) {
      setError('Please select a member');
      return;
    }

    setGenerating(true);
    setError('');

    const result = await generatePerformanceReportAction(
      memberId,
      year,
      month,
      manualTxStarted ? parseInt(manualTxStarted, 10) : undefined,
    );

    if (result.success && result.reportId) {
      router.push(`/dashboard/performance/${result.reportId}`);
    } else {
      setError(result.error ?? 'Failed to generate report');
      setGenerating(false);
    }
  }

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const selectedMember = members.find((m) => m.id === memberId);

  return (
    <Protected>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <nav className="mb-8 text-sm">
          <Link href="/dashboard/performance" className="text-brand-navy hover:text-brand-navy/70">
            Performance Reports
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">Generate</span>
        </nav>

        <h1 className="text-3xl font-bold text-brand-navy mb-2">
          Generate Performance Report
        </h1>
        <p className="text-gray-600 mb-8">
          Generate a monthly funnel performance report for a practice.
        </p>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 space-y-6">
          {/* Member selector */}
          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">
              Practice
            </label>
            {loadingMembers ? (
              <div className="text-sm text-gray-500">Loading members...</div>
            ) : (
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-navy focus:border-brand-navy"
              >
                <option value="">Select a practice</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {!m.hasConfig ? '(not configured)' : ''}
                  </option>
                ))}
              </select>
            )}
            {selectedMember && !selectedMember.hasConfig && (
              <p className="mt-1 text-sm text-orange-600">
                This practice needs AOV and funnel mappings configured first.{' '}
                <Link
                  href={`/dashboard/members/${selectedMember.id}`}
                  className="underline"
                >
                  Configure now
                </Link>
              </p>
            )}
          </div>

          {/* Year & Month */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-navy focus:border-brand-navy"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-1">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-navy focus:border-brand-navy"
              >
                {months.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Manual TX Started */}
          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">
              Treatment Starts (manual override)
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="number"
              min="0"
              value={manualTxStarted}
              onChange={(e) => setManualTxStarted(e.target.value)}
              placeholder="Leave blank to use PRM/submitted data"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-navy focus:border-brand-navy"
            />
            <p className="mt-1 text-xs text-gray-400">
              If left blank, the system will use treatment starts from the PRM or case start submissions.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !memberId || (selectedMember && !selectedMember.hasConfig)}
            className="w-full px-4 py-3 bg-brand-navy text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {generating ? 'Generating report...' : 'Generate Performance Report'}
          </button>
        </div>
      </div>
    </Protected>
  );
}
