'use client';

import { useState } from 'react';
import { fetchPrmCategories, saveFunnelMappings } from '@/app/actions/performance-reports';
import { FUNNEL_STAGES, FUNNEL_STAGE_LABELS } from '@/types/performance-report';
import type { PrmCategory } from '@/types/performance-report';

interface FunnelMappingConfigProps {
  memberId: string;
  existingMappings: {
    prmCategoryId: string;
    prmCategoryName: string;
    funnelStage: string;
  }[];
  hasPrmCredentials: boolean;
}

interface MappingRow {
  categoryId: string;
  categoryName: string;
  funnelStage: string;
}

export default function FunnelMappingConfig({
  memberId,
  existingMappings,
  hasPrmCredentials,
}: FunnelMappingConfigProps) {
  const [categories, setCategories] = useState<PrmCategory[]>([]);
  const [mappings, setMappings] = useState<MappingRow[]>(
    existingMappings.map((m) => ({
      categoryId: m.prmCategoryId,
      categoryName: m.prmCategoryName,
      funnelStage: m.funnelStage,
    })),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [fetched, setFetched] = useState(false);

  async function handleFetchCategories() {
    setLoading(true);
    setMessage('');
    const result = await fetchPrmCategories(memberId);

    if (result.success && result.categories) {
      setCategories(result.categories);
      setFetched(true);

      // Merge with existing mappings
      const existingMap = new Map(mappings.map((m) => [m.categoryId, m.funnelStage]));
      setMappings(
        result.categories.map((c) => ({
          categoryId: c.categoryid,
          categoryName: c.categoryname,
          funnelStage: existingMap.get(c.categoryid) ?? '',
        })),
      );
    } else {
      setMessage(result.error ?? 'Failed to fetch categories');
    }
    setLoading(false);
  }

  function updateStage(categoryId: string, stage: string) {
    setMappings((prev) =>
      prev.map((m) =>
        m.categoryId === categoryId ? { ...m, funnelStage: stage } : m,
      ),
    );
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');

    const toSave = mappings
      .filter((m) => m.funnelStage !== '')
      .map((m) => ({
        prmCategoryId: m.categoryId,
        prmCategoryName: m.categoryName,
        funnelStage: m.funnelStage,
      }));

    const result = await saveFunnelMappings(memberId, toSave);
    setSaving(false);
    setMessage(result.success ? 'Mappings saved' : result.error ?? 'Failed to save');
  }

  if (!hasPrmCredentials) {
    return (
      <p className="text-sm text-gray-500">
        PRM credentials must be configured before setting up funnel mappings.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={handleFetchCategories}
          disabled={loading}
          className="px-4 py-2 border border-brand-navy text-brand-navy text-sm font-medium rounded-md hover:bg-brand-navy/5 disabled:opacity-50"
        >
          {loading ? 'Fetching...' : fetched ? 'Refresh Categories' : 'Fetch PRM Categories'}
        </button>
        {mappings.length > 0 && !fetched && (
          <span className="text-sm text-gray-500">
            {mappings.length} mapping{mappings.length !== 1 ? 's' : ''} configured
          </span>
        )}
      </div>

      {mappings.length > 0 && (
        <>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-brand-navy">
                    PRM Category
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-brand-navy">
                    Funnel Stage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mappings.map((m) => (
                  <tr key={m.categoryId}>
                    <td className="px-4 py-2 text-gray-700">{m.categoryName}</td>
                    <td className="px-4 py-2">
                      <select
                        value={m.funnelStage}
                        onChange={(e) => updateStage(m.categoryId, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-brand-navy focus:border-brand-navy"
                      >
                        <option value="">Unmapped</option>
                        {FUNNEL_STAGES.map((stage) => (
                          <option key={stage} value={stage}>
                            {FUNNEL_STAGE_LABELS[stage]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-brand-navy text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Mappings'}
            </button>
            {message && (
              <span
                className={`text-sm ${message === 'Mappings saved' ? 'text-green-600' : 'text-red-600'}`}
              >
                {message}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
