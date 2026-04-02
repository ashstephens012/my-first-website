'use client';

import { useState } from 'react';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Deliverables that support a flexible planned month on the roadmap
const PLANNABLE_DELIVERABLES = new Set([
  'Annual In-Practice Visit',
  'In-Practice Strategic Workshop',
  'Promotion/Event Campaigns',
  'Landing Pages',
  'In-Practice 6 Month Strategic Plan Revisit',
  'Annual Benchmarking Report',
  'Secret Shopper Calls',
]);

import {
  initDeliverables,
  recordCompletion,
  deleteCompletion,
  updateAllocation,
  updatePlannedMonth,
  updatePlannedMonths,
  addStaffTurnoverProtection,
  removeStaffTurnoverProtection,
} from '@/app/actions/deliverables';

type Completion = {
  id: string;
  completedAt: string;
  notes: string | null;
};

type Deliverable = {
  id: string;
  year: number;
  category: string;
  name: string;
  annualAllocation: number;
  plannedMonth: number | null;
  plannedMonths: number[];
  completions: Completion[];
};

// Deliverables that show "Scheduling Required" until a planned month is set
const SCHEDULING_REQUIRED_DELIVERABLES = new Set([
  'Annual In-Practice Visit',
  'In-Practice Strategic Workshop',
]);

// Deliverables where each instance can be individually placed on the roadmap
const MULTI_PLANNABLE_DELIVERABLES = new Set([
  'Promotion/Event Campaigns',
  'Landing Pages',
]);

// Deliverables that show per-instance delivery tracking
const INSTANCE_DELIVERY_DELIVERABLES = new Set([
  'Annual In-Practice Visit',
  'Promotion/Event Campaigns',
  'Landing Pages',
  '12 Month Strategic Plan',
  'Annual Benchmarking Report',
  'In-Practice 6 Month Strategic Plan Revisit',
  'In-Practice Strategic Workshop',
  'Secret Shopper Calls',
  'Strategic Meetings (Online)',
  'Online Consulting Hours',
]);

// Default month placements matching roadmap logic (used to pre-populate dropdowns)
const FIXED_DEFAULT_MONTHS: Record<string, number[]> = {
  'Landing Pages': [1, 4, 7, 10],
  '12 Month Strategic Plan': [1],
  'Annual Benchmarking Report': [5],
  'In-Practice 6 Month Strategic Plan Revisit': [7],
  'Secret Shopper Calls': [10, 3],
  'Strategic Meetings (Online)': [2, 5, 8, 11],
};

function getDefaultMonths(name: string, allocation: number): number[] {
  if (FIXED_DEFAULT_MONTHS[name]) {
    return FIXED_DEFAULT_MONTHS[name].slice(0, allocation);
  }
  // Mirror distributeAcrossYear logic
  if (allocation <= 0) return [];
  const effective = allocation > 12 ? 4 : allocation;
  const interval = 12 / effective;
  const months: number[] = [];
  for (let i = 0; i < effective; i++) {
    months.push(Math.min(Math.round(interval * (i + 1)), 12));
  }
  return months;
}

export default function DeliverablesManager({
  memberId,
  membershipTier,
  deliverables,
  isAdmin = false,
}: {
  memberId: string;
  membershipTier: string | null;
  deliverables: Deliverable[];
  isAdmin?: boolean;
}) {
  const currentYear = new Date().getFullYear();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editingAllocation, setEditingAllocation] = useState<string | null>(null);
  const [allocationValue, setAllocationValue] = useState('');

  // Derive available years from data, always include current year
  const availableYears = Array.from(
    new Set([currentYear, ...deliverables.map((d) => d.year)])
  ).sort((a, b) => b - a);

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const yearDeliverables = deliverables.filter((d) => d.year === selectedYear);
  const isPastYear = selectedYear < currentYear;

  // Normalise legacy category names into current groupings
  const CATEGORY_MAP: Record<string, string> = {
    'Data & Reporting': 'Digital Strategy',
    'Website': 'Digital Strategy',
    'Paid Ads': 'Digital Strategy',
  };

  // Mandatory Digital Strategy deliverables (shown first with red asterisk)
  const MANDATORY_DELIVERABLES = new Set([
    'Annual In-Practice Visit',
    'Promotion/Event Campaigns',
    'Strategic Meetings (Online)',
    'Strategic Reports',
    'In-Practice Strategic Workshop',
    'In-Practice 6 Month Strategic Plan Revisit',
    'Online Consulting Hours',
    'Secret Shopper Calls',
    '12 Month Strategic Plan',
    'Annual Benchmarking Report',
  ]);

  // Group deliverables by category, with mandatory items sorted first
  const grouped = yearDeliverables.reduce<Record<string, Deliverable[]>>((acc, d) => {
    const category = CATEGORY_MAP[d.category] ?? d.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(d);
    return acc;
  }, {});

  // Sort Digital Strategy: mandatory first, then the rest
  if (grouped['Digital Strategy']) {
    grouped['Digital Strategy'].sort((a, b) => {
      const aM = MANDATORY_DELIVERABLES.has(a.name) ? 0 : 1;
      const bM = MANDATORY_DELIVERABLES.has(b.name) ? 0 : 1;
      return aM - bM;
    });
  }

  async function handleInit() {
    setLoading(true);
    const result = await initDeliverables(memberId, selectedYear);
    if (!result.success) {
      alert(result.error ?? 'Failed to initialise deliverables');
    }
    setLoading(false);
  }

  async function handleRecordCompletion(e: React.FormEvent, deliverableId: string) {
    e.preventDefault();
    setLoading(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const result = await recordCompletion(deliverableId, formData);
    if (result.success) {
      form.reset();
    } else {
      alert(result.error ?? 'Failed to record completion');
    }
    setLoading(false);
  }

  async function handleDeleteCompletion(completionId: string) {
    if (!window.confirm('Delete this completion record?')) return;
    setLoading(true);
    const result = await deleteCompletion(completionId, memberId);
    if (!result.success) {
      alert(result.error ?? 'Failed to delete completion');
    }
    setLoading(false);
  }

  async function handleUndoDelivery(completionId: string) {
    setLoading(true);
    const result = await deleteCompletion(completionId, memberId);
    if (!result.success) {
      alert(result.error ?? 'Failed to undo delivery');
    }
    setLoading(false);
  }

  async function handleMarkDelivered(deliverableId: string, date: string, instanceIndex: number) {
    setLoading(true);
    const formData = new FormData();
    formData.set('completedAt', date);
    formData.set('notes', `Delivered #${instanceIndex + 1}`);
    const result = await recordCompletion(deliverableId, formData);
    if (!result.success) {
      alert(result.error ?? 'Failed to mark as delivered');
    }
    setLoading(false);
  }

  async function handleUpdateAllocation(deliverableId: string) {
    const val = parseInt(allocationValue, 10);
    if (isNaN(val) || val < -1) {
      alert('Allocation must be -1 (unlimited) or a positive number');
      return;
    }
    setLoading(true);
    const result = await updateAllocation(deliverableId, val, memberId);
    if (result.success) {
      setEditingAllocation(null);
      setAllocationValue('');
    } else {
      alert(result.error ?? 'Failed to update allocation');
    }
    setLoading(false);
  }

  function getTrafficLightClass(d: Deliverable): string {
    const completed = d.completions.length;
    // Green: fully delivered (unlimited counts as always fulfilled)
    if (d.annualAllocation === -1 || completed >= d.annualAllocation) {
      return 'border-l-4 border-l-emerald-400';
    }
    // Red: needs scheduling attention — plannable but no planned month set
    if (SCHEDULING_REQUIRED_DELIVERABLES.has(d.name) && !d.plannedMonth) {
      return 'border-l-4 border-l-red-400';
    }
    // Amber: scheduled / in progress but not yet fully delivered
    return 'border-l-4 border-l-amber-400';
  }

  function getProgressColor(completed: number, allocation: number): string {
    if (allocation === -1) return 'bg-emerald-500';
    if (completed === 0) return 'bg-gray-300';
    if (completed >= allocation) return 'bg-emerald-500';
    return 'bg-amber-500';
  }

  function getProgressWidth(completed: number, allocation: number): number {
    if (allocation === -1) return 100;
    if (allocation === 0) return 0;
    return Math.min(Math.round((completed / allocation) * 100), 100);
  }

  function formatAllocation(allocation: number): string {
    return allocation === -1 ? 'Unlimited' : allocation.toString();
  }

  // Staff Turnover Protection slots for the selected year
  const stpSlots = yearDeliverables.filter((d) => d.category === 'Staff Turnover Protection');
  const tierLevel = (membershipTier ?? '').trim().split(/\s+/).pop() ?? '';
  const maxStpSlots = tierLevel === 'Diamond' ? 3 : 2;

  // Category display order (Staff Turnover Protection handled separately)
  const CATEGORY_ORDER = ['Digital Strategy', 'Consulting'];
  const orderedCategories = CATEGORY_ORDER.filter((c) => grouped[c]);

  async function handleAddSTP() {
    setLoading(true);
    const result = await addStaffTurnoverProtection(memberId, selectedYear);
    if (!result.success) {
      alert(result.error ?? 'Failed to add Staff Turnover Protection');
    }
    setLoading(false);
  }

  async function handleRemoveSTP(deliverableId: string) {
    if (!window.confirm('Remove this Staff Turnover Protection Training slot and all its completions?')) return;
    setLoading(true);
    const result = await removeStaffTurnoverProtection(deliverableId, memberId);
    if (!result.success) {
      alert(result.error ?? 'Failed to remove slot');
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
        <h2 className="text-lg font-semibold text-brand-navy">Deliverables Tracker</h2>
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
          <p className="flex items-start gap-2 text-xs text-gray-500 mb-1">
            <svg className="w-4 h-4 shrink-0 text-gray-400 mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Use this section to chart the key deliverables on the Member&apos;s Roadmap for the year ahead. Some of these will automatically be scheduled, but can be amended if needed. Please also mark when these have been delivered with the respective date, and the progress will then update on the roadmap automatically.
          </p>
          <p className="text-xs text-gray-500 ml-6 mt-1"><span className="text-red-500">*</span> (red) = Mandatory Delivery Required</p>
          <div className="flex items-center gap-4 text-xs text-gray-400 mt-4 mb-4">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm border-l-4 border-l-emerald-400 bg-gray-100" /> Delivered</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm border-l-4 border-l-amber-400 bg-gray-100" /> Scheduled</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm border-l-4 border-l-red-400 bg-gray-100" /> Needs Scheduling</span>
          </div>
          {/* Year selector */}
          {availableYears.length > 1 && (
            <div className="flex items-center gap-2 mb-4">
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    setSelectedYear(year);
                    setExpandedRow(null);
                    setEditingAllocation(null);
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedYear === year
                      ? 'bg-brand-navy text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {year}
                  {year === currentYear && (
                    <span className="ml-1 text-xs opacity-70">(Current)</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {isPastYear && yearDeliverables.length > 0 && (
            <div className="mb-4 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500">
              Viewing {selectedYear} deliverables (read-only archive).
            </div>
          )}

          {yearDeliverables.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-4">
                No deliverables initialised for {selectedYear}.
              </p>
              {isAdmin && selectedYear === currentYear && membershipTier ? (
                <button
                  onClick={handleInit}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-navy hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Initialising...' : `Initialise ${selectedYear} Deliverables`}
                </button>
              ) : isAdmin && selectedYear === currentYear ? (
                <p className="text-sm text-amber-600">
                  Set a membership tier on this member before initialising deliverables.
                </p>
              ) : null}
            </div>
          ) : (
            <>
              {/* Re-initialise button (picks up new template items via upsert) */}
              {isAdmin && !isPastYear && membershipTier && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleInit}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-1.5 border border-brand-navy rounded-md text-sm font-medium text-brand-navy bg-white hover:bg-brand-navy/5 disabled:opacity-50"
                  >
                    {loading ? 'Syncing...' : 'Re-initialise from Tier Template'}
                  </button>
                </div>
              )}
              {orderedCategories.map((category) => {
                const items = grouped[category];
                return (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {items.map((d) => {
                      const completed = d.completions.length;
                      const isExpanded = expandedRow === d.id;
                      const progressColor = getProgressColor(completed, d.annualAllocation);
                      const progressWidth = getProgressWidth(completed, d.annualAllocation);

                      return (
                        <div key={d.id} className={`border border-gray-100 rounded-md ${getTrafficLightClass(d)}`}>
                          {/* Row */}
                          <div
                            className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50"
                            onClick={() => setExpandedRow(isExpanded ? null : d.id)}
                          >
                            {/* Chevron */}
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>

                            {/* Name */}
                            <span className="text-sm font-medium text-brand-navy flex-1 min-w-0">
                              {d.name}
                              {MANDATORY_DELIVERABLES.has(d.name) && (
                                <span className="text-red-500 ml-0.5">*</span>
                              )}
                              {SCHEDULING_REQUIRED_DELIVERABLES.has(d.name) && !d.plannedMonth && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                  Scheduling Required
                                </span>
                              )}
                            </span>

                            {/* Progress text */}
                            <span className="text-sm text-gray-500 flex-shrink-0 w-24 text-right">
                              {isAdmin && !isPastYear && editingAllocation === d.id ? (
                                <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  {completed} /
                                  <input
                                    type="number"
                                    min={-1}
                                    value={allocationValue}
                                    onChange={(e) => setAllocationValue(e.target.value)}
                                    className="w-14 px-1 py-0.5 border border-gray-300 rounded text-sm text-right"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleUpdateAllocation(d.id);
                                      if (e.key === 'Escape') { setEditingAllocation(null); setAllocationValue(''); }
                                    }}
                                  />
                                  <button
                                    onClick={() => handleUpdateAllocation(d.id)}
                                    disabled={loading}
                                    className="text-xs text-brand-navy hover:underline disabled:opacity-50"
                                  >
                                    Save
                                  </button>
                                </span>
                              ) : isAdmin && !isPastYear ? (
                                <span
                                  className="cursor-pointer hover:underline"
                                  title="Click to edit allocation"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAllocation(d.id);
                                    setAllocationValue(d.annualAllocation.toString());
                                  }}
                                >
                                  {completed} / {formatAllocation(d.annualAllocation)}
                                </span>
                              ) : (
                                <span>{completed} / {formatAllocation(d.annualAllocation)}</span>
                              )}
                            </span>

                            {/* Progress bar */}
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                              <div
                                className={`h-full rounded-full transition-all ${progressColor}`}
                                style={{ width: `${progressWidth}%` }}
                              />
                            </div>
                          </div>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50">
                              {/* Planned month selector — admin only, single instance */}
                              {isAdmin && !isPastYear && PLANNABLE_DELIVERABLES.has(d.name) && !MULTI_PLANNABLE_DELIVERABLES.has(d.name) && (
                                <div className="mb-3 flex items-center gap-3">
                                  <label className="text-xs font-medium text-gray-500">Planned Month</label>
                                  <select
                                    value={d.plannedMonth ?? getDefaultMonths(d.name, d.annualAllocation)[0] ?? ''}
                                    onChange={async (e) => {
                                      const val = e.target.value ? parseInt(e.target.value, 10) : null;
                                      setLoading(true);
                                      const result = await updatePlannedMonth(d.id, val, memberId);
                                      if (!result.success) {
                                        alert(result.error ?? 'Failed to update planned month');
                                      }
                                      setLoading(false);
                                    }}
                                    disabled={loading}
                                    className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                  >
                                    <option value="">Not scheduled</option>
                                    {SHORT_MONTHS.map((m, i) => (
                                      <option key={i} value={i + 1}>{m}</option>
                                    ))}
                                  </select>
                                  {(d.plannedMonth || getDefaultMonths(d.name, d.annualAllocation)[0]) && (
                                    <span className="text-xs text-gray-400">
                                      Will appear on roadmap in {SHORT_MONTHS[(d.plannedMonth ?? getDefaultMonths(d.name, d.annualAllocation)[0]) - 1]}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Planned months selector — admin only, multi instance */}
                              {isAdmin && !isPastYear && MULTI_PLANNABLE_DELIVERABLES.has(d.name) && (
                                <div className="mb-3">
                                  <label className="text-xs font-medium text-gray-500 mb-2 block">
                                    Planned Months ({(d.plannedMonths ?? []).length} of {d.annualAllocation} scheduled)
                                  </label>
                                  <div className="space-y-1.5">
                                    {Array.from({ length: d.annualAllocation }, (_, idx) => (
                                      <div key={idx} className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 w-6">{idx + 1}.</span>
                                        <select
                                          value={(d.plannedMonths ?? [])[idx] ?? getDefaultMonths(d.name, d.annualAllocation)[idx] ?? ''}
                                          onChange={async (e) => {
                                            const val = e.target.value ? parseInt(e.target.value, 10) : null;
                                            const defaults = getDefaultMonths(d.name, d.annualAllocation);
                                            const current = (d.plannedMonths ?? []).length > 0 ? [...(d.plannedMonths ?? [])] : [...defaults];
                                            // Pad array if needed
                                            while (current.length < idx) current.push(0);
                                            if (val) {
                                              current[idx] = val;
                                            } else {
                                              current.splice(idx, 1);
                                            }
                                            const filtered = current.filter((m) => m > 0);
                                            setLoading(true);
                                            const result = await updatePlannedMonths(d.id, filtered, memberId);
                                            if (!result.success) {
                                              alert(result.error ?? 'Failed to update planned months');
                                            }
                                            setLoading(false);
                                          }}
                                          disabled={loading}
                                          className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                                        >
                                          <option value="">Not scheduled</option>
                                          {SHORT_MONTHS.map((m, i) => (
                                            <option key={i} value={i + 1}>{m}</option>
                                          ))}
                                        </select>
                                        {((d.plannedMonths ?? [])[idx] || getDefaultMonths(d.name, d.annualAllocation)[idx]) && (
                                          <span className="text-xs text-gray-400">
                                            {SHORT_MONTHS[((d.plannedMonths ?? [])[idx] || getDefaultMonths(d.name, d.annualAllocation)[idx]) - 1]}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Per-instance delivery tracking for specific deliverables */}
                              {INSTANCE_DELIVERY_DELIVERABLES.has(d.name) ? (
                                <div className="mb-1">
                                  <div className="text-xs font-medium text-gray-500 mb-2">Delivery Status</div>
                                  <div className="space-y-1.5">
                                    {Array.from({ length: d.annualAllocation }, (_, idx) => {
                                      const months = d.plannedMonths ?? [];
                                      const defaults = getDefaultMonths(d.name, d.annualAllocation);
                                      const month = months[idx] ?? (d.annualAllocation === 1 ? d.plannedMonth : null) ?? defaults[idx] ?? null;
                                      // Match completion to this instance by stored marker, fall back to chronological order
                                      const instanceMarker = `Delivered #${idx + 1}`;
                                      const matchedCompletion = d.completions.find((c) => c.notes === instanceMarker);
                                      const sortedCompletions = d.completions
                                        .slice()
                                        .filter((c) => !c.notes?.match(/^Delivered #\d+$/))
                                        .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
                                      // Count how many earlier instances claimed a legacy (untagged) completion
                                      const legacyClaimedBefore = Array.from({ length: idx }, (_, i) =>
                                        d.completions.find((c) => c.notes === `Delivered #${i + 1}`) ? 0 : 1
                                      ).reduce<number>((sum, v) => sum + v, 0);
                                      const fallbackCompletion = !matchedCompletion && legacyClaimedBefore < sortedCompletions.length
                                        ? sortedCompletions[legacyClaimedBefore] : null;
                                      const completion = matchedCompletion ?? fallbackCompletion;
                                      const isDelivered = !!completion;

                                      return (
                                        <div key={idx} className="flex items-center gap-3 py-1.5 px-2 rounded border border-gray-100 bg-white">
                                          {/* Status indicator */}
                                          <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${isDelivered ? 'bg-brand-green' : 'bg-gray-300'}`} />
                                          {/* Instance label */}
                                          <span className="text-sm text-brand-navy flex-1 min-w-0">
                                            {d.annualAllocation > 1 ? `${idx + 1}. ` : ''}
                                            {month ? SHORT_MONTHS[month - 1] : 'Not scheduled'}
                                            {isDelivered && completion && (
                                              <span className="text-xs text-gray-400 ml-2">
                                                Delivered {new Date(completion.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                              </span>
                                            )}
                                          </span>
                                          {/* Action button */}
                                          {isAdmin && !isPastYear && (
                                            isDelivered && completion ? (
                                              <button
                                                onClick={() => handleUndoDelivery(completion.id)}
                                                disabled={loading}
                                                className="text-xs text-red-600 hover:underline disabled:opacity-50 flex-shrink-0"
                                              >
                                                Undo
                                              </button>
                                            ) : (
                                              <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                                                <label className="text-[10px] text-gray-400">Delivered on</label>
                                                <input
                                                  type="date"
                                                  defaultValue={new Date().toISOString().split('T')[0]}
                                                  className="px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                                                  data-deliver-date={`${d.id}-${idx}`}
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const input = document.querySelector(`[data-deliver-date="${d.id}-${idx}"]`) as HTMLInputElement;
                                                    handleMarkDelivered(d.id, input?.value || new Date().toISOString().split('T')[0], idx);
                                                  }}
                                                  disabled={loading}
                                                  className="px-2.5 py-1 bg-brand-navy text-white rounded text-xs hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                                                >
                                                  {loading ? 'Saving...' : 'Mark as Delivered'}
                                                </button>
                                              </span>
                                            )
                                          )}
                                          {!isAdmin && isDelivered && (
                                            <span className="text-xs font-medium text-brand-green flex-shrink-0">Delivered</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Completion history */}
                                  {d.completions.length > 0 && (
                                    <div className={!isPastYear ? 'mb-3' : ''}>
                                      <div className="text-xs font-medium text-gray-500 mb-1">
                                        Completion History
                                      </div>
                                      <div className="space-y-1">
                                        {d.completions
                                          .slice()
                                          .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                                          .map((c) => (
                                            <div
                                              key={c.id}
                                              className="flex items-center justify-between text-sm py-1"
                                            >
                                              <div>
                                                <span className="text-brand-navy font-medium">
                                                  {new Date(c.completedAt).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                  })}
                                                </span>
                                                {c.notes && (
                                                  <span className="text-gray-500 ml-2">{c.notes}</span>
                                                )}
                                              </div>
                                              {isAdmin && !isPastYear && (
                                                <button
                                                  onClick={() => handleDeleteCompletion(c.id)}
                                                  disabled={loading}
                                                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                                                >
                                                  Delete
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}

                                  {d.completions.length === 0 && isPastYear && (
                                    <p className="text-sm text-gray-400 py-1">No completions recorded.</p>
                                  )}

                                  {/* Add completion form — admin, current year only */}
                                  {isAdmin && !isPastYear && (
                                    <form
                                      onSubmit={(e) => handleRecordCompletion(e, d.id)}
                                      className="flex items-end gap-2"
                                    >
                                      <div>
                                        <label className="text-xs text-gray-500 block mb-1">Date</label>
                                        <input
                                          type="date"
                                          name="completedAt"
                                          defaultValue={new Date().toISOString().split('T')[0]}
                                          required
                                          className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <label className="text-xs text-gray-500 block mb-1">
                                          Notes (optional)
                                        </label>
                                        <input
                                          type="text"
                                          name="notes"
                                          placeholder="e.g. Q1 report delivered"
                                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                        />
                                      </div>
                                      <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-3 py-1.5 bg-brand-navy text-white rounded text-sm hover:opacity-90 disabled:opacity-50"
                                      >
                                        {loading ? 'Saving...' : 'Record'}
                                      </button>
                                    </form>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                );
              })}

              {/* Staff Turnover Protection — optional add-on (admin only) */}
              {(stpSlots.length > 0 || (isAdmin && !isPastYear && yearDeliverables.length > 0)) && (
                <div className="mb-6 last:mb-0 mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Consulting - Staff Turnover Protection
                    </h3>
                    {isAdmin && !isPastYear && stpSlots.length < maxStpSlots && (
                      <button
                        onClick={handleAddSTP}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-1.5 border border-brand-navy rounded-md text-sm font-medium text-brand-navy bg-white hover:bg-brand-navy/5 disabled:opacity-50"
                      >
                        {loading ? 'Adding...' : '+ Add Training Slot'}
                      </button>
                    )}
                  </div>

                  {stpSlots.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      No Staff Turnover Protection Training added. Up to {maxStpSlots} slots available (4 hours each).
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {stpSlots.map((d) => {
                        const completed = d.completions.length;
                        const isRowExpanded = expandedRow === d.id;
                        const progressColor = getProgressColor(completed, d.annualAllocation);
                        const progressWidth = getProgressWidth(completed, d.annualAllocation);

                        return (
                          <div key={d.id} className={`border border-gray-100 rounded-md ${getTrafficLightClass(d)}`}>
                            <div
                              className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50"
                              onClick={() => setExpandedRow(isRowExpanded ? null : d.id)}
                            >
                              <svg
                                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isRowExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>

                              <span className="text-sm font-medium text-brand-navy flex-1 min-w-0">
                                {d.name}
                              </span>

                              <span className="text-sm text-gray-500 flex-shrink-0 w-24 text-right">
                                {completed} / {formatAllocation(d.annualAllocation)}
                              </span>

                              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                                <div
                                  className={`h-full rounded-full transition-all ${progressColor}`}
                                  style={{ width: `${progressWidth}%` }}
                                />
                              </div>

                              {isAdmin && !isPastYear && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRemoveSTP(d.id); }}
                                  disabled={loading}
                                  className="text-xs text-red-600 hover:underline disabled:opacity-50 flex-shrink-0"
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            {isRowExpanded && (
                              <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50">
                                {d.completions.length > 0 && (
                                  <div className={isAdmin && !isPastYear ? 'mb-3' : ''}>
                                    <div className="text-xs font-medium text-gray-500 mb-1">
                                      Completion History
                                    </div>
                                    <div className="space-y-1">
                                      {d.completions
                                        .slice()
                                        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                                        .map((c) => (
                                          <div key={c.id} className="flex items-center justify-between text-sm py-1">
                                            <div>
                                              <span className="text-brand-navy font-medium">
                                                {new Date(c.completedAt).toLocaleDateString('en-GB', {
                                                  day: 'numeric',
                                                  month: 'short',
                                                  year: 'numeric',
                                                })}
                                              </span>
                                              {c.notes && <span className="text-gray-500 ml-2">{c.notes}</span>}
                                            </div>
                                            {isAdmin && !isPastYear && (
                                              <button
                                                onClick={() => handleDeleteCompletion(c.id)}
                                                disabled={loading}
                                                className="text-xs text-red-600 hover:underline disabled:opacity-50"
                                              >
                                                Delete
                                              </button>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}

                                {d.completions.length === 0 && isPastYear && (
                                  <p className="text-sm text-gray-400 py-1">No completions recorded.</p>
                                )}

                                {isAdmin && !isPastYear && (
                                  <form
                                    onSubmit={(e) => handleRecordCompletion(e, d.id)}
                                    className="flex items-end gap-2"
                                  >
                                    <div>
                                      <label className="text-xs text-gray-500 block mb-1">Date</label>
                                      <input
                                        type="date"
                                        name="completedAt"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        required
                                        className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <label className="text-xs text-gray-500 block mb-1">Notes (optional)</label>
                                      <input
                                        type="text"
                                        name="notes"
                                        placeholder="e.g. Training session completed"
                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                      />
                                    </div>
                                    <button
                                      type="submit"
                                      disabled={loading}
                                      className="px-3 py-1.5 bg-brand-navy text-white rounded text-sm hover:opacity-90 disabled:opacity-50"
                                    >
                                      {loading ? 'Saving...' : 'Record'}
                                    </button>
                                  </form>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
