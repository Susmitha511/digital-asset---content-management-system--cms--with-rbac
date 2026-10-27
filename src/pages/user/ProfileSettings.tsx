import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { UserCircle, Lock, HardDrive, Shield, KeyRound, Building, Mail, CheckCircle2 } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      error('New password must be at least 8 characters long');
      return;
    }

    setSubmittingPassword(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.message || 'Failed to update password');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const usedMB = ((user?.storageUsed || 0) / (1024 * 1024)).toFixed(1);
  const quotaMB = ((user?.storageQuota || 104857600) / (1024 * 1024)).toFixed(0);
  const percentUsed = Math.min(100, Math.round(((user?.storageUsed || 0) / (user?.storageQuota || 104857600)) * 100));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-indigo-400" />
          User Profile &amp; Security Credentials
        </h1>
        <p className="text-xs text-slate-400">
          Manage your account profile, storage limits, and cryptographic credentials.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-sm font-semibold text-white">Identity &amp; Department</h3>
        <div className="flex items-center gap-4">
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
            alt={user?.name}
            className="w-16 h-16 rounded-full bg-slate-800 object-cover border-2 border-slate-700"
          />
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">{user?.name}</h4>
            <div className="text-xs text-slate-400 font-mono">{user?.email}</div>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-0.5">
              <span className="capitalize font-semibold text-indigo-400">Role: {user?.role}</span>
              <span>·</span>
              <span>{user?.department || 'Cyber Security Department'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Quota Card */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            Storage Quota Consumption
          </span>
          <span className="font-mono text-slate-300">{usedMB} / {quotaMB} MB</span>
        </div>

        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              percentUsed > 85 ? 'bg-rose-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-400">
          Your personal digital asset storage is quota-bounded by system policy to prevent disk exhaustion.
        </p>
      </div>

      {/* Change Password Card */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Change Account Password</h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">New Password (min 8 characters)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submittingPassword}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{submittingPassword ? 'Saving...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
