'use client';

import { useState } from 'react';
import { savePerformanceConfig } from '@/app/actions/performance-reports';

interface PerformanceConfigProps {
  memberId: string;
  currentAov: number | null;
  currentSheetId: string | null;
}

export default function PerformanceConfig({
  memberId,
  currentAov,
  currentSheetId,
}: PerformanceConfigProps) {
  const [aov, setAov] = useState(currentAov?.toString() ?? '');
  const [sheetId, setSheetId] = useState(currentSheetId ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSave() {
    const aovNum = parseFloat(aov);
    if (!aov || isNaN(aovNum) || aovNum <= 0) {
      setMessage('Please enter a valid average order value');
      return;
    }

    setSaving(true);
    setMessage('');
    const result = await savePerformanceConfig(memberId, {
      averageOrderValue: aovNum,
      tcTrackerSheetId: sheetId.trim() || undefined,
    });

    setSaving(false);
    setMessage(result.success ? 'Saved' : result.error ?? 'Failed to save');
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-brand-navy mb-1">
            Average Order Value (AOV)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
            <input
              type="number"
              value={aov}
              onChange={(e) => setAov(e.target.value)}
              placeholder="e.g. 4500"
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-navy focus:border-brand-navy"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-navy mb-1">
            TC Tracker Google Sheet ID
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <input
            type="text"
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
            placeholder="Sheet ID from URL"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-navy focus:border-brand-navy"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-brand-navy text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Config'}
        </button>
        {message && (
          <span className={`text-sm ${message === 'Saved' ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
