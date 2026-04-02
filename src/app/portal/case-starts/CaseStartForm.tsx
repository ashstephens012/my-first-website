'use client';

import { useState } from 'react';
import { submitCaseStart } from '@/app/actions/case-starts';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type Submission = {
  id: string;
  year: number;
  month: number;
  caseStarts: number;
};

export default function CaseStartForm({
  submissions,
  annualTarget,
  currentYear,
}: {
  submissions: Submission[];
  annualTarget: string | null;
  currentYear: number;
}) {
  // Default to previous month (members report in arrears)
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // getMonth() is 0-indexed, so .getMonth() gives prev month's 1-indexed value
  const prevMonthYear = now.getMonth() === 0 ? currentYear - 1 : currentYear;
  const existing = submissions.find((s) => s.year === prevMonthYear && s.month === prevMonth);

  const [caseStarts, setCaseStarts] = useState(existing?.caseStarts?.toString() ?? '');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const ytdTotal = submissions.reduce((sum, s) => sum + s.caseStarts, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.set('year', prevMonthYear.toString());
    formData.set('month', prevMonth.toString());
    formData.set('caseStarts', caseStarts);

    const result = await submitCaseStart(formData);
    if (result.success) {
      setMessage({ type: 'success', text: existing ? 'Updated successfully.' : 'Submitted successfully.' });
    } else {
      setMessage({ type: 'error', text: result.error ?? 'Something went wrong.' });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      {/* Submit form for current month */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-brand-navy mb-4">
          {MONTH_NAMES[prevMonth - 1]} {prevMonthYear}
        </h2>
        <form onSubmit={handleSubmit} className="flex items-end gap-4">
          <div className="flex-1">
            <label htmlFor="caseStarts" className="block text-sm font-medium text-gray-700 mb-1">
              Case Starts
            </label>
            <input
              id="caseStarts"
              type="number"
              min="0"
              required
              value={caseStarts}
              onChange={(e) => setCaseStarts(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-navy focus:border-brand-navy"
              placeholder="Enter number of case starts"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-brand-navy text-white rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : existing ? 'Update' : 'Submit'}
          </button>
        </form>
        {message && (
          <p className={`mt-3 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
      </div>

      {/* YTD submissions table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-navy">
            {currentYear} Submissions
          </h2>
          <div className="text-sm text-gray-600">
            YTD Total: <span className="font-bold text-brand-navy">{ytdTotal}</span>
            {annualTarget && (
              <span className="text-gray-400"> / {annualTarget} target</span>
            )}
          </div>
        </div>
        {submissions.length === 0 ? (
          <p className="text-gray-500 text-sm">No submissions yet for {currentYear}.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-500 font-medium">Month</th>
                <th className="text-right py-2 text-gray-500 font-medium">Case Starts</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-b border-gray-100">
                  <td className="py-2 text-brand-navy">{MONTH_NAMES[s.month - 1]}</td>
                  <td className="py-2 text-right font-medium text-brand-navy">{s.caseStarts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
