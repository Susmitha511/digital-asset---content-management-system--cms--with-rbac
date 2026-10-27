import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { SystemSettings as ISystemSettings } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { Settings, Save, ShieldCheck, HardDrive, Bell, Lock } from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const { success, error } = useToast();
  const [settings, setSettings] = useState<ISystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then(res => {
      if (res.success) setSettings(res.settings);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      await api.updateSettings(settings);
      success('System security settings updated successfully.');
    } catch (err: any) {
      error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          Institutional Security &amp; Storage Configuration
        </h1>
        <p className="text-xs text-slate-400">
          Enforce upload thresholds, storage limits, and security headers.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-white">Application Identity &amp; Department</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">System Application Name</label>
              <input
                type="text"
                value={settings.appName}
                onChange={e => setSettings({ ...settings, appName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Organization / Academic Entity</label>
              <input
                type="text"
                value={settings.orgName}
                onChange={e => setSettings({ ...settings, orgName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>
        </div>

        {/* Storage & Limits */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-white">Storage Quotas &amp; File Ingestion Limits</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Maximum Single File Upload (MB)</label>
              <input
                type="number"
                value={settings.maxUploadSizeMB}
                onChange={e => setSettings({ ...settings, maxUploadSizeMB: parseInt(e.target.value, 10) || 50 })}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
              <p className="mt-1 text-[11px] text-slate-500">Current server threshold: 50 MB</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Default User Storage Quota (MB)</label>
              <input
                type="number"
                value={settings.defaultStorageQuotaMB}
                onChange={e => setSettings({ ...settings, defaultStorageQuotaMB: parseInt(e.target.value, 10) || 100 })}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
              <p className="mt-1 text-[11px] text-slate-500">Allocated to newly registered user accounts</p>
            </div>
          </div>
        </div>

        {/* Security Toggles */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-white">System Security Policies</h3>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-800 rounded-xl cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-white">Public Account Registration</div>
                <div className="text-[11px] text-slate-400">Allow new students and researchers to register accounts</div>
              </div>
              <input
                type="checkbox"
                checked={settings.enableRegistration}
                onChange={e => setSettings({ ...settings, enableRegistration: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded bg-slate-800 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-800 rounded-xl cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-white">Immutable Security Audit Stream</div>
                <div className="text-[11px] text-slate-400">Record all file reads, uploads, role modifications, and logins</div>
              </div>
              <input
                type="checkbox"
                checked={settings.enableAuditLog}
                onChange={e => setSettings({ ...settings, enableAuditLog: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded bg-slate-800 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-800 rounded-xl cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-rose-400">Maintenance Mode</div>
                <div className="text-[11px] text-slate-400">Halt non-admin access during database maintenance or incident triage</div>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-4 h-4 text-rose-600 rounded bg-slate-800 border-slate-700"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Applying Policies...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
