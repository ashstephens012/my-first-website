'use client';

import { useState } from 'react';
import { updateAnnualCaseStartsTarget } from '@/app/actions/members';

export default function AnnualTargetBar({
  memberId,
  annualCaseStartsTarget,
  ytdTotal,
  parsedTarget,
  progressPct,
}: {
  memberId: string;
  annualCaseStartsTarget: string | null;
  ytdTotal: number;
  parsedTarget: number | null;
  progressPct: number | null;
}) {
  const [showModal, setShowModal] = useState(false);
  const [target, setTarget] = useState(annualCaseStartsTarget ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await updateAnnualCaseStartsTarget(memberId, target.trim());
    if (result.success) {
      setShowModal(false);
    } else {
      alert(result.error ?? 'Failed to update target');
    }
    setSaving(false);
  }

  return (
    <>
      <div
        onClick={() => { setTarget(annualCaseStartsTarget ?? ''); setShowModal(true); }}
        className="bg-brand-navy text-white rounded-lg shadow-sm p-6 mb-8 cursor-pointer hover:opacity-95 transition-opacity"
      >
        {annualCaseStartsTarget ? (
          <>
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium opacity-80">Annual Case Starts Target</div>
              {progressPct !== null && (
                <div className="text-sm font-medium opacity-80">
                  {ytdTotal} / {parsedTarget} YTD
                </div>
              )}
            </div>
            <div className="text-2xl font-bold mb-3">{annualCaseStartsTarget}</div>
            {progressPct !== null && (
              <div>
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-green rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="text-sm mt-1 opacity-80">{progressPct}% of annual target</div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium opacity-80">Annual Case Starts Target</div>
            <div className="text-sm font-medium opacity-60">Click to set target</div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-brand-navy mb-4">
              Annual Case Starts Target
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="target" className="block text-sm font-medium text-gray-700 mb-2">
                  Target (e.g. 150 or 100-150)
                </label>
                <input
                  type="text"
                  id="target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. 150 or 100-150"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-navy focus:border-brand-navy"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-brand-navy hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
