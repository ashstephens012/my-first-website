'use client';

import { useState } from 'react';
import {
  createMemberLogin,
  resendMemberSetupEmail,
  removeMemberLogin,
  updatePortalUserTier,
  updatePortalUserJobTitle,
} from '@/app/actions/members';

type PortalUser = {
  id: string;
  name: string | null;
  email: string | null;
  jobTitle: string | null;
  portalTier: number | null;
  createdAt: Date;
};

export default function PortalLoginManager({
  memberId,
  memberName,
  users,
}: {
  memberId: string;
  memberName: string;
  users: PortalUser[];
}) {
  const [loading, setLoading] = useState(false);
  const [setupUrl, setSetupUrl] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newTier, setNewTier] = useState<number>(1);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    setLoading(true);
    setSetupUrl(null);
    const result = await createMemberLogin(memberId, newName.trim(), newEmail.trim(), newTier, newJobTitle.trim() || undefined);
    if (result.success) {
      if (result.setupUrl) {
        setSetupUrl(result.setupUrl);
      } else {
        alert('Portal user created. A password setup email has been sent.');
      }
      setNewName('');
      setNewEmail('');
      setNewJobTitle('');
      setNewTier(1);
      setShowAddForm(false);
    } else {
      alert(result.error ?? 'Failed to create portal login');
    }
    setLoading(false);
  }

  async function handleResend(userId: string) {
    setLoading(true);
    setSetupUrl(null);
    const result = await resendMemberSetupEmail(memberId, userId);
    if (result.success) {
      if (result.setupUrl) {
        setSetupUrl(result.setupUrl);
      } else {
        alert('Password setup email has been resent.');
      }
    } else {
      alert(result.error ?? 'Failed to resend email');
    }
    setLoading(false);
  }

  async function handleRemove(userId: string, userName: string | null) {
    if (!window.confirm(`Remove portal access for ${userName || 'this user'}? They will no longer be able to sign in.`)) return;
    setLoading(true);
    setSetupUrl(null);
    const result = await removeMemberLogin(memberId, userId);
    if (result.success) {
      alert('Portal login removed.');
    } else {
      alert(result.error ?? 'Failed to remove portal login');
    }
    setLoading(false);
  }

  const [editingJobTitle, setEditingJobTitle] = useState<string | null>(null);
  const [jobTitleValue, setJobTitleValue] = useState('');

  async function handleSaveJobTitle(userId: string) {
    setLoading(true);
    const result = await updatePortalUserJobTitle(userId, jobTitleValue);
    if (result.success) {
      setEditingJobTitle(null);
      setJobTitleValue('');
    } else {
      alert(result.error ?? 'Failed to update job title');
    }
    setLoading(false);
  }

  async function handleTierChange(userId: string, tier: number) {
    setLoading(true);
    const result = await updatePortalUserTier(userId, tier);
    if (!result.success) {
      alert(result.error ?? 'Failed to update tier');
    }
    setLoading(false);
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-brand-navy">Portal Access</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 border border-brand-navy rounded-md text-sm font-medium text-brand-navy bg-white hover:bg-brand-navy/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {showAddForm ? 'Cancel' : '+ Add Portal User'}
        </button>
      </div>

      {/* Existing users list */}
      {users.length === 0 ? (
        <p className="text-sm text-gray-500">No portal users</p>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-brand-navy truncate">
                    {user.name || 'Unnamed'}
                  </div>
                  {editingJobTitle === user.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={jobTitleValue}
                        onChange={(e) => setJobTitleValue(e.target.value)}
                        placeholder="Job title"
                        className="text-xs px-1.5 py-0.5 border border-gray-300 rounded w-32"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveJobTitle(user.id);
                          if (e.key === 'Escape') { setEditingJobTitle(null); setJobTitleValue(''); }
                        }}
                      />
                      <button
                        onClick={() => handleSaveJobTitle(user.id)}
                        disabled={loading}
                        className="text-xs text-brand-navy hover:underline disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div
                      className="text-xs text-gray-500 truncate cursor-pointer hover:text-brand-navy"
                      title="Click to edit job title"
                      onClick={() => { setEditingJobTitle(user.id); setJobTitleValue(user.jobTitle ?? ''); }}
                    >
                      {user.jobTitle || <span className="text-gray-300 italic">Add job title</span>}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 truncate">{user.email}</div>
                </div>
                <select
                  value={user.portalTier ?? 1}
                  onChange={(e) => handleTierChange(user.id, Number(e.target.value))}
                  disabled={loading}
                  className="text-xs border border-gray-300 rounded px-1.5 py-0.5 bg-white"
                >
                  <option value={1}>Tier 1 - Ortho & PM</option>
                  <option value={2}>Tier 2 - Practice Team</option>
                </select>
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                <button
                  onClick={() => handleResend(user.id)}
                  disabled={loading}
                  className="text-xs text-brand-navy hover:underline disabled:opacity-50"
                >
                  Resend Setup Email
                </button>
                <button
                  onClick={() => handleRemove(user.id, user.name)}
                  disabled={loading}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add portal user form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="mt-3 bg-gray-50 rounded-md p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              className="px-2 py-1.5 border border-gray-300 rounded text-sm"
            />
            <input
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="px-2 py-1.5 border border-gray-300 rounded text-sm"
            />
            <input
              type="text"
              placeholder="Job Title (optional)"
              value={newJobTitle}
              onChange={(e) => setNewJobTitle(e.target.value)}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm"
            />
            <select
              value={newTier}
              onChange={(e) => setNewTier(Number(e.target.value))}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm"
            >
              <option value={1}>Tier 1 - Ortho & PM</option>
              <option value={2}>Tier 2 - Practice Team</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-brand-navy hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Portal User'}
          </button>
        </form>
      )}

      {/* Fallback setup URL if email failed */}
      {setupUrl && (
        <div className="mt-3 text-sm">
          <p className="text-amber-700 mb-1">
            Email could not be sent. Share this link manually:
          </p>
          <input
            readOnly
            value={setupUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono bg-gray-50"
          />
        </div>
      )}
    </div>
  );
}
