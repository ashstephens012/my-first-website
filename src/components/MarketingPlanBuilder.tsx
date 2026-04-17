'use client';

import { useState } from 'react';
import {
  initMarketingPlan,
  addMarketingChannel,
  updateMarketingChannel,
  deleteMarketingChannel,
  addMarketingActivity,
  updateMarketingActivity,
  deleteMarketingActivity,
} from '@/app/actions/marketing-plan';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

type Activity = {
  id: string;
  month: number;
  label: string;
  ownership: string;
  sortOrder: number;
};

type Channel = {
  id: string;
  name: string;
  alwaysOn: boolean;
  description: string | null;
  sortOrder: number;
  activities: Activity[];
};

type MarketingPlan = {
  id: string;
  year: number;
  channels: Channel[];
};

export default function MarketingPlanBuilder({
  memberId,
  membershipTier,
  plan,
}: {
  memberId: string;
  membershipTier: string | null;
  plan: MarketingPlan | null;
}) {
  const currentYear = new Date().getFullYear();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null);

  // Add activity form state
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newMonth, setNewMonth] = useState(1);
  const [newLabel, setNewLabel] = useState('');
  const [newOwnership, setNewOwnership] = useState<'TIO' | 'PRACTICE'>('TIO');

  // Edit activity state
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editMonth, setEditMonth] = useState(1);
  const [editLabel, setEditLabel] = useState('');
  const [editOwnership, setEditOwnership] = useState<'TIO' | 'PRACTICE'>('TIO');

  // Add channel state
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelAlwaysOn, setNewChannelAlwaysOn] = useState(false);
  const [newChannelDescription, setNewChannelDescription] = useState('');

  // Edit channel state
  const [editingChannel, setEditingChannel] = useState<string | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelAlwaysOn, setEditChannelAlwaysOn] = useState(false);
  const [editChannelDescription, setEditChannelDescription] = useState('');

  async function handleInit() {
    setLoading(true);
    const result = await initMarketingPlan(memberId, currentYear);
    if (!result.success) {
      alert(result.error ?? 'Failed to initialise marketing plan');
    }
    setLoading(false);
  }

  async function handleAddChannel() {
    if (!newChannelName.trim()) return;
    setLoading(true);
    const result = await addMarketingChannel(memberId, currentYear, {
      name: newChannelName.trim(),
      alwaysOn: newChannelAlwaysOn,
      description: newChannelDescription.trim() || undefined,
    });
    if (result.success) {
      setNewChannelName('');
      setNewChannelAlwaysOn(false);
      setNewChannelDescription('');
      setShowAddChannel(false);
    } else {
      alert(result.error ?? 'Failed to add channel');
    }
    setLoading(false);
  }

  async function handleUpdateChannel(channelId: string) {
    setLoading(true);
    const result = await updateMarketingChannel(channelId, memberId, {
      name: editChannelName.trim() || undefined,
      alwaysOn: editChannelAlwaysOn,
      description: editChannelDescription.trim() || null,
    });
    if (result.success) {
      setEditingChannel(null);
    } else {
      alert(result.error ?? 'Failed to update channel');
    }
    setLoading(false);
  }

  async function handleDeleteChannel(channelId: string) {
    if (!window.confirm('Delete this channel and all its activities?')) return;
    setLoading(true);
    const result = await deleteMarketingChannel(channelId, memberId);
    if (!result.success) {
      alert(result.error ?? 'Failed to delete channel');
    }
    setLoading(false);
  }

  async function handleAddActivity(channelId: string) {
    if (!newLabel.trim()) return;
    setLoading(true);
    const result = await addMarketingActivity(channelId, memberId, {
      month: newMonth,
      label: newLabel.trim(),
      ownership: newOwnership,
    });
    if (result.success) {
      setAddingTo(null);
      setNewLabel('');
      setNewMonth(1);
      setNewOwnership('TIO');
    } else {
      alert(result.error ?? 'Failed to add activity');
    }
    setLoading(false);
  }

  async function handleUpdateActivity(activityId: string) {
    setLoading(true);
    const result = await updateMarketingActivity(activityId, memberId, {
      month: editMonth,
      label: editLabel.trim(),
      ownership: editOwnership,
    });
    if (result.success) {
      setEditingActivity(null);
    } else {
      alert(result.error ?? 'Failed to update activity');
    }
    setLoading(false);
  }

  async function handleDeleteActivity(activityId: string) {
    if (!window.confirm('Delete this activity?')) return;
    setLoading(true);
    const result = await deleteMarketingActivity(activityId, memberId);
    if (!result.success) {
      alert(result.error ?? 'Failed to delete activity');
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
        <h2 className="text-lg font-semibold text-brand-navy">Marketing Plan Builder</h2>
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
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          <p className="flex items-start gap-2 text-xs text-gray-500 mb-4">
            <svg className="w-4 h-4 shrink-0 text-gray-400 mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Manage the 12-month strategic marketing plan for this member. Initialise from the tier template, then customise channels and activities as needed.
          </p>

          {!plan ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-4">
                No marketing plan initialised for {currentYear}.
              </p>
              {membershipTier ? (
                <button
                  onClick={handleInit}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-navy hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Initialising...' : `Initialise ${currentYear} Marketing Plan`}
                </button>
              ) : (
                <p className="text-sm text-amber-600">
                  Set a membership tier on this member before initialising the marketing plan.
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Re-initialise button */}
              {membershipTier && (
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

              {/* Channel list */}
              <div className="space-y-2">
                {plan.channels.map((channel) => {
                  const isChannelExpanded = expandedChannel === channel.id;

                  return (
                    <div key={channel.id} className="border border-gray-100 rounded-md">
                      {/* Channel header */}
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedChannel(isChannelExpanded ? null : channel.id)}
                      >
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isChannelExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm font-medium text-brand-navy flex-1">
                          {channel.name}
                          {channel.alwaysOn && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Always On
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-gray-400">
                          {channel.activities.length} {channel.activities.length === 1 ? 'activity' : 'activities'}
                        </span>
                      </div>

                      {/* Channel detail */}
                      {isChannelExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50">
                          {/* Edit channel inline */}
                          {editingChannel === channel.id ? (
                            <div className="mb-3 p-3 bg-white rounded border border-gray-200 space-y-2">
                              <input
                                type="text"
                                value={editChannelName}
                                onChange={(e) => setEditChannelName(e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                placeholder="Channel name"
                              />
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={editChannelAlwaysOn}
                                    onChange={(e) => setEditChannelAlwaysOn(e.target.checked)}
                                  />
                                  Always On
                                </label>
                                <input
                                  type="text"
                                  value={editChannelDescription}
                                  onChange={(e) => setEditChannelDescription(e.target.value)}
                                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                  placeholder="Description (optional)"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateChannel(channel.id)}
                                  disabled={loading}
                                  className="px-3 py-1.5 bg-brand-navy text-white rounded text-sm hover:opacity-90 disabled:opacity-50"
                                >
                                  {loading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setEditingChannel(null)}
                                  className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mb-3 flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingChannel(channel.id);
                                  setEditChannelName(channel.name);
                                  setEditChannelAlwaysOn(channel.alwaysOn);
                                  setEditChannelDescription(channel.description ?? '');
                                }}
                                className="text-xs text-brand-navy hover:underline"
                              >
                                Edit Channel
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteChannel(channel.id);
                                }}
                                disabled={loading}
                                className="text-xs text-red-600 hover:underline disabled:opacity-50"
                              >
                                Delete Channel
                              </button>
                            </div>
                          )}

                          {/* Activities table */}
                          {channel.activities.length > 0 && (
                            <table className="w-full text-sm mb-3">
                              <thead>
                                <tr className="text-xs text-gray-500 uppercase">
                                  <th className="text-left pb-1 pr-2">Month</th>
                                  <th className="text-left pb-1 pr-2">Label</th>
                                  <th className="text-left pb-1 pr-2">Owner</th>
                                  <th className="text-right pb-1">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {channel.activities.map((activity) => (
                                  <tr key={activity.id} className="border-t border-gray-100">
                                    {editingActivity === activity.id ? (
                                      <>
                                        <td className="py-1.5 pr-2">
                                          <select
                                            value={editMonth}
                                            onChange={(e) => setEditMonth(parseInt(e.target.value, 10))}
                                            className="px-1 py-1 border border-gray-300 rounded text-sm w-full"
                                          >
                                            {SHORT_MONTHS.map((m, i) => (
                                              <option key={i} value={i + 1}>{m}</option>
                                            ))}
                                          </select>
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          <input
                                            type="text"
                                            value={editLabel}
                                            onChange={(e) => setEditLabel(e.target.value)}
                                            className="w-full px-1 py-1 border border-gray-300 rounded text-sm"
                                          />
                                        </td>
                                        <td className="py-1.5 pr-2">
                                          <select
                                            value={editOwnership}
                                            onChange={(e) => setEditOwnership(e.target.value as 'TIO' | 'PRACTICE')}
                                            className="px-1 py-1 border border-gray-300 rounded text-sm w-full"
                                          >
                                            <option value="TIO">TIO</option>
                                            <option value="PRACTICE">Practice</option>
                                          </select>
                                        </td>
                                        <td className="py-1.5 text-right">
                                          <button
                                            onClick={() => handleUpdateActivity(activity.id)}
                                            disabled={loading}
                                            className="text-xs text-brand-navy hover:underline disabled:opacity-50 mr-2"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() => setEditingActivity(null)}
                                            className="text-xs text-gray-500 hover:underline"
                                          >
                                            Cancel
                                          </button>
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td className="py-1.5 pr-2 text-brand-navy">{SHORT_MONTHS[activity.month - 1]}</td>
                                        <td className="py-1.5 pr-2 text-brand-navy">{activity.label}</td>
                                        <td className="py-1.5 pr-2">
                                          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                            activity.ownership === 'TIO'
                                              ? 'bg-red-100 text-red-900'
                                              : 'bg-amber-100 text-amber-900'
                                          }`}>
                                            {activity.ownership}
                                          </span>
                                        </td>
                                        <td className="py-1.5 text-right">
                                          <button
                                            onClick={() => {
                                              setEditingActivity(activity.id);
                                              setEditMonth(activity.month);
                                              setEditLabel(activity.label);
                                              setEditOwnership(activity.ownership as 'TIO' | 'PRACTICE');
                                            }}
                                            className="text-xs text-brand-navy hover:underline mr-2"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeleteActivity(activity.id)}
                                            disabled={loading}
                                            className="text-xs text-red-600 hover:underline disabled:opacity-50"
                                          >
                                            Delete
                                          </button>
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}

                          {channel.activities.length === 0 && !channel.alwaysOn && (
                            <p className="text-sm text-gray-400 mb-3">No activities yet.</p>
                          )}

                          {/* Add activity form */}
                          {addingTo === channel.id ? (
                            <div className="flex items-end gap-2 p-3 bg-white rounded border border-gray-200">
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Month</label>
                                <select
                                  value={newMonth}
                                  onChange={(e) => setNewMonth(parseInt(e.target.value, 10))}
                                  className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                                >
                                  {SHORT_MONTHS.map((m, i) => (
                                    <option key={i} value={i + 1}>{m}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex-1">
                                <label className="text-xs text-gray-500 block mb-1">Label</label>
                                <input
                                  type="text"
                                  value={newLabel}
                                  onChange={(e) => setNewLabel(e.target.value)}
                                  placeholder="e.g. Lead Promo"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Owner</label>
                                <select
                                  value={newOwnership}
                                  onChange={(e) => setNewOwnership(e.target.value as 'TIO' | 'PRACTICE')}
                                  className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                                >
                                  <option value="TIO">TIO</option>
                                  <option value="PRACTICE">Practice</option>
                                </select>
                              </div>
                              <button
                                onClick={() => handleAddActivity(channel.id)}
                                disabled={loading || !newLabel.trim()}
                                className="px-3 py-1.5 bg-brand-navy text-white rounded text-sm hover:opacity-90 disabled:opacity-50"
                              >
                                {loading ? 'Adding...' : 'Add'}
                              </button>
                              <button
                                onClick={() => { setAddingTo(null); setNewLabel(''); }}
                                className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setAddingTo(channel.id); setNewLabel(''); setNewMonth(1); setNewOwnership('TIO'); }}
                              className="text-xs text-brand-navy hover:underline"
                            >
                              + Add Activity
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add channel */}
              {showAddChannel ? (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 space-y-3">
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="Channel name"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newChannelAlwaysOn}
                        onChange={(e) => setNewChannelAlwaysOn(e.target.checked)}
                      />
                      Always On
                    </label>
                    <input
                      type="text"
                      value={newChannelDescription}
                      onChange={(e) => setNewChannelDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddChannel}
                      disabled={loading || !newChannelName.trim()}
                      className="px-3 py-1.5 bg-brand-navy text-white rounded text-sm hover:opacity-90 disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add Channel'}
                    </button>
                    <button
                      onClick={() => { setShowAddChannel(false); setNewChannelName(''); }}
                      className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddChannel(true)}
                  className="mt-4 inline-flex items-center px-3 py-1.5 border border-brand-navy rounded-md text-sm font-medium text-brand-navy bg-white hover:bg-brand-navy/5"
                >
                  + Add Channel
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
