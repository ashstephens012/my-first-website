'use client';

import { useState } from 'react';
import { adminSubmitCaseStart, adminDeleteCaseStart } from '@/app/actions/case-starts';

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

export default function CaseStartsManager({
  memberId,
  submissions,
}: {
  memberId: string;
  submissions: Submission[];
}) {
  const currentYear = new Date().getFullYear();
  const [expanded, setExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addYear, setAddYear] = useState(currentYear);
  const [addMonth, setAddMonth] = useState(new Date().getMonth() + 1);
  const [addCaseStarts, setAddCaseStarts] = useState('');

  const ytdTotal = submissions
    .filter((s) => s.year === currentYear)
    .reduce((sum, s) => sum + s.caseStarts, 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.set('year', addYear.toString());
    formData.set('month', addMonth.toString());
    formData.set('caseStarts', addCaseStarts);

    const result = await adminSubmitCaseStart(memberId, formData);
    if (result.success) {
      setAddCaseStarts('');
      setShowAddForm(false);
    } else {
      alert(result.error ?? 'Failed to add entry');
    }
    setLoading(false);
  }

  async function handleEdit(sub: Submission) {
    setLoading(true);
    const formData = new FormData();
    formData.set('year', sub.year.toString());
    formData.set('month', sub.month.toString());
    formData.set('caseStarts', editValue);

    const result = await adminSubmitCaseStart(memberId, formData);
    if (result.success) {
      setEditingId(null);
      setEditValue('');
    } else {
      alert(result.error ?? 'Failed to update entry');
    }
    setLoading(false);
  }

  async function handleDelete(sub: Submission) {
    if (!window.confirm(`Delete ${MONTH_NAMES[sub.month - 1]} ${sub.year} entry (${sub.caseStarts} case starts)?`)) return;
    setLoading(true);
    const result = await adminDeleteCaseStart(sub.id, memberId);
    if (!result.success) {
      alert(result.error ?? 'Failed to delete entry');
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors rounded-lg"
      >
        <h2 className="text-lg font-semibold text-brand-navy">Case Starts</h2>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          <p className="flex items-start gap-2 text-xs text-gray-500 mb-4">
            <svg className="w-4 h-4 shrink-0 text-gray-400 mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Members are prompted to add their previous months total Case Starts figures within the Member Portal. You can also add these for them here, or amend any figures they have previously submitted.
          </p>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {currentYear} YTD Total: <span className="font-bold text-brand-navy">{ytdTotal}</span>
            </p>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 border border-brand-navy rounded-md text-sm font-medium text-brand-navy bg-white hover:bg-brand-navy/5 disabled:opacity-50"
            >
              {showAddForm ? 'Cancel' : '+ Add Entry'}
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <form onSubmit={handleAdd} className="mb-4 bg-gray-50 rounded-md p-3">
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="number"
                  value={addYear}
                  onChange={(e) => setAddYear(Number(e.target.value))}
                  min={2000}
                  max={2100}
                  className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                  placeholder="Year"
                />
                <select
                  value={addMonth}
                  onChange={(e) => setAddMonth(Number(e.target.value))}
                  className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={addCaseStarts}
                  onChange={(e) => setAddCaseStarts(e.target.value)}
                  min={0}
                  required
                  placeholder="Case starts"
                  className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 bg-brand-navy text-white rounded text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}

          {/* Submissions table */}
          {submissions.length === 0 ? (
            <p className="text-sm text-gray-500">No submissions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">Month</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Case Starts</th>
                  <th className="text-right py-2 text-gray-500 font-medium w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-100">
                    <td className="py-2 text-brand-navy">
                      {MONTH_NAMES[sub.month - 1]} {sub.year}
                    </td>
                    <td className="py-2 text-right">
                      {editingId === sub.id ? (
                        <input
                          type="number"
                          min={0}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium text-brand-navy">{sub.caseStarts}</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {editingId === sub.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(sub)}
                            disabled={loading}
                            className="text-xs text-brand-navy hover:underline disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditValue(''); }}
                            className="text-xs text-gray-500 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingId(sub.id); setEditValue(sub.caseStarts.toString()); }}
                            disabled={loading}
                            className="text-xs text-brand-navy hover:underline disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(sub)}
                            disabled={loading}
                            className="text-xs text-red-600 hover:underline disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
