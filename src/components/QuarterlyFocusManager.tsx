'use client';

import { useState } from 'react';
import { adminUpsertQuarterlyFocus, adminDeleteQuarterlyFocus } from '@/app/actions/quarterly-focus';

type Focus = {
  id: string;
  quarter: number;
  focus: string;
};

const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Q4'];

export default function QuarterlyFocusManager({
  memberId,
  year,
  focuses,
}: {
  memberId: string;
  year: number;
  focuses: Focus[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    for (const f of focuses) {
      map[f.quarter] = f.focus;
    }
    return map;
  });

  function updateDraft(quarter: number, value: string) {
    setDrafts((prev) => ({ ...prev, [quarter]: value }));
  }

  async function handleSave(quarter: number) {
    const text = drafts[quarter]?.trim();
    if (!text) return;
    setLoading(quarter);

    const formData = new FormData();
    formData.set('year', year.toString());
    formData.set('quarter', quarter.toString());
    formData.set('focus', text);

    const result = await adminUpsertQuarterlyFocus(memberId, formData);
    if (!result.success) {
      alert(result.error ?? 'Failed to save');
    }
    setLoading(null);
  }

  async function handleClear(quarter: number) {
    const entry = focuses.find((f) => f.quarter === quarter);
    if (!entry) {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[quarter];
        return next;
      });
      return;
    }

    if (!window.confirm(`Clear Q${quarter} focus?`)) return;
    setLoading(quarter);

    const result = await adminDeleteQuarterlyFocus(entry.id, memberId);
    if (result.success) {
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[quarter];
        return next;
      });
    } else {
      alert(result.error ?? 'Failed to clear');
    }
    setLoading(null);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors rounded-lg"
      >
        <h2 className="text-lg font-semibold text-brand-navy">
          Areas of Focus ({year})
        </h2>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-3">
          <p className="flex items-start gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4 shrink-0 text-gray-400 mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Please define the key areas of focus that you&apos;re working on with the Member for each quarter of the year. Member&apos;s will be able to see these core focuses within the Member Portal, once you have added them. You can also amend them anytime from here.
          </p>
          <div className="mb-4" />
          {[1, 2, 3, 4].map((q) => {
            const existing = focuses.find((f) => f.quarter === q);
            const draft = drafts[q] ?? '';
            const isChanged = existing ? draft !== existing.focus : draft.trim().length > 0;

            return (
              <div key={q} className="flex items-start gap-3">
                <span className="text-sm font-semibold text-brand-navy w-8 pt-2">
                  {QUARTER_LABELS[q - 1]}
                </span>
                <textarea
                  value={draft}
                  onChange={(e) => updateDraft(q, e.target.value)}
                  rows={2}
                  placeholder={`Enter Q${q} areas of focus...`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand-navy focus:border-brand-navy"
                />
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => handleSave(q)}
                    disabled={loading === q || !isChanged || !draft.trim()}
                    className="px-3 py-1.5 bg-brand-navy text-white rounded text-xs hover:opacity-90 disabled:opacity-40"
                  >
                    {loading === q ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={() => handleClear(q)}
                    disabled={loading === q || (!existing && !draft.trim())}
                    className="px-3 py-1.5 text-red-600 border border-red-200 rounded text-xs hover:bg-red-50 disabled:opacity-40"
                  >
                    Clear
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
