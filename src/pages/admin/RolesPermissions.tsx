import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.js';
import { RoleDefinition, Permission } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { ShieldAlert, ShieldCheck, Check, X, Lock, Save, RefreshCw } from 'lucide-react';

export const RolesPermissions: React.FC = () => {
  const { success, error } = useToast();
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

  // Local state of role permissions to support editing and saving
  const [rolePermissionsState, setRolePermissionsState] = useState<Record<string, string[]>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getRolesAndPermissions();
      if (res.success) {
        setRoles(res.roles);
        setPermissions(res.permissions);

        const permMap: Record<string, string[]> = {};
        for (const r of res.roles) {
          permMap[r._id] = [...r.permissions];
        }
        setRolePermissionsState(permMap);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load roles and permissions');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTogglePermission = (roleId: string, permId: string, isSystemAdmin: boolean) => {
    if (isSystemAdmin && permId === 'settings:manage') {
      error('Administrator must retain core security settings permission.');
      return;
    }

    setRolePermissionsState(prev => {
      const current = prev[roleId] || [];
      const has = current.includes(permId);
      const updated = has ? current.filter(p => p !== permId) : [...current, permId];
      return { ...prev, [roleId]: updated };
    });
  };

  const handleSaveRolePermissions = async (role: RoleDefinition) => {
    setSavingRoleId(role._id);
    try {
      const newPerms = rolePermissionsState[role._id] || [];
      await api.updateRolePermissions(role._id, newPerms);
      success(`Role policy updated for ${role.displayName}`);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to update permissions');
    } finally {
      setSavingRoleId(null);
    }
  };

  const groupedPermissions = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const cat = p.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            Role-Based Access Control (RBAC) Matrix
          </h1>
          <p className="text-xs text-slate-400">
            Enforce granular capability boundaries and security invariants across institutional roles.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reload Policies
        </button>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map(r => (
          <div
            key={r._id}
            className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${
                r.name === 'admin' ? 'text-indigo-400' : r.name === 'editor' ? 'text-emerald-400' : 'text-slate-300'
              }`}>
                Role: {r.name}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {(rolePermissionsState[r._id] || []).length} Granted
              </span>
            </div>

            <h3 className="text-sm font-semibold text-white">{r.displayName}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{r.description}</p>

            <button
              onClick={() => handleSaveRolePermissions(r)}
              disabled={savingRoleId === r._id}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingRoleId === r._id ? 'Applying Policy...' : 'Save Policy'}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Interactive Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            Permission Enforcement Grid
          </span>
          <span className="text-[11px] text-slate-400">
            Click checkboxes to toggle privileges. Click "Save Policy" above to persist changes.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-1/3">System Capability / Permission</th>
                {roles.map(r => (
                  <th key={r._id} className="py-3 px-4 text-center">
                    <span className="capitalize">{r.name}</span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <React.Fragment key={category}>
                  <tr className="bg-slate-950/30">
                    <td colSpan={roles.length + 1} className="py-2 px-4 text-[11px] font-semibold text-indigo-400 uppercase tracking-wider font-mono">
                      {category} Capabilities
                    </td>
                  </tr>

                  {perms.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-white">{p.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{p.description}</div>
                      </td>

                      {roles.map(r => {
                        const hasPerm = (rolePermissionsState[r._id] || []).includes(p.id);
                        const isSystemAdmin = r.name === 'admin';

                        return (
                          <td key={r._id} className="py-2.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(r._id, p.id, isSystemAdmin)}
                              className={`p-1.5 rounded-md transition-colors ${
                                hasPerm
                                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                  : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                              }`}
                              title={hasPerm ? 'Permitted' : 'Denied'}
                            >
                              {hasPerm ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
