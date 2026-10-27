import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.js';
import { User, UserRole, UserStatus } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { 
  Users, 
  Search, 
  UserPlus, 
  ShieldAlert, 
  ShieldCheck, 
  MoreVertical, 
  X, 
  Check, 
  Lock, 
  HardDrive,
  Building,
  Mail,
  AlertTriangle
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { success, error } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('user');

  // New user form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as UserRole,
    department: 'Cyber Security Operations',
    storageQuotaMB: 100
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getUsers({
        search,
        role: roleFilter,
        status: statusFilter,
        limit: 50
      });
      if (res.success) {
        setUsers(res.users);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, error]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(formData);
      success(`User ${formData.email} provisioned successfully`);
      setIsCreateOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        department: 'Cyber Security Operations',
        storageQuotaMB: 100
      });
      loadUsers();
    } catch (err: any) {
      error(err.message || 'User provisioning failed');
    }
  };

  const handleUpdateRole = async () => {
    if (!roleModalUser) return;
    try {
      await api.updateUserRole(roleModalUser._id, newRole);
      success(`Role updated to ${newRole} for ${roleModalUser.name}`);
      setRoleModalUser(null);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to update role');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateUserStatus(user._id, nextStatus);
      success(`Account status changed to ${nextStatus} for ${user.name}`);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to toggle account status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            User Identity &amp; RBAC Directory
          </h1>
          <p className="text-xs text-slate-400">
            Provision accounts, manage role assignments, and enforce storage quotas.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Provision New User
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or department..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="editor">Editor / Reviewer</option>
            <option value="user">Standard User</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Storage Used / Quota</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  const usedMB = ((u.storageUsed || 0) / (1024 * 1024)).toFixed(1);
                  const quotaMB = ((u.storageQuota || 104857600) / (1024 * 1024)).toFixed(0);

                  return (
                    <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}
                            alt={u.name}
                            className="w-8 h-8 rounded-full bg-slate-800 object-cover"
                          />
                          <div>
                            <div className="font-semibold text-white">{u.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`font-medium capitalize ${
                          u.role === 'admin' ? 'text-indigo-400' : u.role === 'editor' ? 'text-emerald-400' : 'text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`capitalize font-medium ${
                          u.status === 'active' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                        {u.department || 'General'}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-300">
                        {usedMB} MB / {quotaMB} MB
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => {
                            setRoleModalUser(u);
                            setNewRole(u.role);
                          }}
                          className="px-2.5 py-1 text-xs text-indigo-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                        >
                          Change Role
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                            u.status === 'active'
                              ? 'text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20'
                              : 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20'
                          }`}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Modify RBAC Role Assignment</h3>
              <button onClick={() => setRoleModalUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Assigning new access role to <strong className="text-white">{roleModalUser.name}</strong> ({roleModalUser.email}).
            </div>

            <div className="space-y-2">
              {[
                { id: 'admin', label: 'Administrator', desc: 'Full system, asset, and user permissions' },
                { id: 'editor', label: 'Editor / Reviewer', desc: 'Can review content and curate digital assets' },
                { id: 'user', label: 'Standard User', desc: 'Upload personal assets and submit content for review' }
              ].map(r => (
                <div
                  key={r.id}
                  onClick={() => setNewRole(r.id as UserRole)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    newRole === r.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-xs">
                    <span>{r.label}</span>
                    {newRole === r.id && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{r.desc}</div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
              >
                Apply Role Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provision User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Provision New Institutional Account</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Dr. Gregory Stone"
                  className="w-full px-3 py-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="gregory.stone@cms.cybersec.edu"
                  className="w-full px-3 py-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="user">User</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Storage Quota (MB)</label>
                  <input
                    type="number"
                    value={formData.storageQuotaMB}
                    onChange={e => setFormData({ ...formData, storageQuotaMB: parseInt(e.target.value, 10) || 100 })}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
