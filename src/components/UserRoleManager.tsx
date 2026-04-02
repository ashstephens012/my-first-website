'use client';

import { useState } from 'react';
import { updateUserRole, deleteUser, createUser, changeUserPassword, sendPasswordResetEmail } from '@/app/actions/users';

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: Date;
};

interface UserRoleManagerProps {
  users: UserRow[];
  currentUserRole: string;
  currentUserId: string;
}

export default function UserRoleManager({ users, currentUserRole, currentUserId }: UserRoleManagerProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [changePasswordId, setChangePasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetEmailStatus, setResetEmailStatus] = useState<{ userId: string; message: string } | null>(null);
  const isAdmin = currentUserRole === 'LEADERSHIP';

  async function handleRoleChange(userId: string, newRole: string) {
    setLoading(userId);
    const result = await updateUserRole(userId, newRole);
    if (!result.success) {
      alert(result.error ?? 'Failed to update role');
    }
    setLoading(null);
  }

  async function handleDelete(userId: string) {
    setLoading(userId);
    const result = await deleteUser(userId);
    if (!result.success) {
      alert(result.error ?? 'Failed to delete user');
    }
    setLoading(null);
    setConfirmDeleteId(null);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    const result = await createUser(newUser);
    if (result.success) {
      setShowAddForm(false);
      setNewUser({ name: '', email: '', password: '', role: 'USER' });
    } else {
      setAddError(result.error ?? 'Failed to create user');
    }
    setAddLoading(false);
  }

  async function handleChangePassword(userId: string) {
    if (!newPassword || newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    setLoading(userId);
    const result = await changeUserPassword(userId, newPassword);
    if (result.success) {
      setChangePasswordId(null);
      setNewPassword('');
    } else {
      alert(result.error ?? 'Failed to change password');
    }
    setLoading(null);
  }

  async function handleSendReset(userId: string) {
    setLoading(userId);
    setResetEmailStatus(null);
    const result = await sendPasswordResetEmail(userId);
    if (result.success) {
      setResetEmailStatus({ userId, message: 'Reset email sent!' });
    } else {
      setResetEmailStatus({ userId, message: result.error ?? 'Failed to send' });
    }
    setLoading(null);
    setTimeout(() => setResetEmailStatus(null), 4000);
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div>
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 transition-colors"
            >
              + Add User
            </button>
          ) : (
            <form
              onSubmit={handleCreateUser}
              className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 space-y-3"
            >
              <h3 className="text-sm font-semibold text-brand-navy">New Staff User</h3>
              {addError && (
                <p className="text-sm text-red-600">{addError}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="password"
                  placeholder="Password (min 8 chars)"
                  required
                  minLength={8}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="USER">USER</option>
                  <option value="LEADERSHIP">LEADERSHIP</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  {addLoading ? 'Creating…' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setAddError(null); }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            {isAdmin && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-navy">
                  {user.name || 'Unnamed'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {isAdmin ? (
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={user.role === 'MEMBER' || loading === user.id}
                      className="border border-gray-300 rounded px-2 py-1 text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {user.role === 'MEMBER' ? (
                        <option value="MEMBER">MEMBER</option>
                      ) : (
                        <>
                          <option value="USER">USER</option>
                          <option value="LEADERSHIP">LEADERSHIP</option>
                        </>
                      )}
                    </select>
                  ) : (
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'LEADERSHIP'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'MEMBER'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {user.role !== 'MEMBER' && (
                      <div className="flex flex-col items-end gap-2">
                        {/* Password change inline form */}
                        {changePasswordId === user.id ? (
                          <span className="inline-flex items-center gap-2">
                            <input
                              type="password"
                              placeholder="New password"
                              minLength={8}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-sm w-36"
                              autoFocus
                            />
                            <button
                              onClick={() => handleChangePassword(user.id)}
                              disabled={loading === user.id}
                              className="text-brand-navy hover:text-opacity-80 font-medium text-xs disabled:opacity-50"
                            >
                              {loading === user.id ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              onClick={() => { setChangePasswordId(null); setNewPassword(''); }}
                              className="text-gray-500 hover:text-gray-700 text-xs"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-3">
                            <button
                              onClick={() => { setChangePasswordId(user.id); setNewPassword(''); setConfirmDeleteId(null); }}
                              className="text-brand-navy hover:text-opacity-80 text-xs font-medium"
                            >
                              Change Password
                            </button>
                            {!isSelf && (
                              <button
                                onClick={() => handleSendReset(user.id)}
                                disabled={loading === user.id}
                                className="text-brand-navy hover:text-opacity-80 text-xs font-medium disabled:opacity-50"
                              >
                                {loading === user.id ? 'Sending…' : 'Send Reset'}
                              </button>
                            )}
                          </div>
                        )}
                        {/* Reset email feedback */}
                        {resetEmailStatus?.userId === user.id && (
                          <span className={`text-xs ${resetEmailStatus.message.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                            {resetEmailStatus.message}
                          </span>
                        )}
                        {/* Delete / You label */}
                        {isSelf ? (
                          <span className="text-xs text-gray-400">You</span>
                        ) : confirmDeleteId === user.id ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="text-xs text-gray-500">Are you sure?</span>
                            <button
                              onClick={() => handleDelete(user.id)}
                              disabled={loading === user.id}
                              className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                            >
                              {loading === user.id ? 'Deleting…' : 'Yes, delete'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => { setConfirmDeleteId(user.id); setChangePasswordId(null); }}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </div>
  );
}
