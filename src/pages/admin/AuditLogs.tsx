import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.js';
import { AuditLog } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { 
  ScrollText, 
  Search, 
  Download, 
  ShieldCheck, 
  Calendar, 
  Filter, 
  RefreshCw,
  Clock,
  ArrowDownToLine
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { error } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');

  const loadLogs = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs({
        search,
        action: actionFilter,
        resourceType: resourceFilter,
        page,
        limit: 25
      });
      if (res.success) {
        setLogs(res.logs);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, resourceFilter, error]);

  useEffect(() => {
    loadLogs(1);
  }, [loadLogs]);

  const handleExportCsv = () => {
    window.location.href = '/api/audit-logs/export-csv';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-indigo-400" />
            Immutable Security Audit Trail
          </h1>
          <p className="text-xs text-slate-400">
            Non-repudiable transaction history capturing logins, permission changes, downloads, and approvals.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => loadLogs(1)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search audit trail by actor, IP, or details..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="USER_LOGIN_SUCCESS">Login Success</option>
            <option value="USER_LOGIN_FAILED">Login Failed</option>
            <option value="ASSET_UPLOAD">Asset Upload</option>
            <option value="ASSET_DOWNLOAD_AUTHORIZED">Asset Download</option>
            <option value="CONTENT_PUBLISHED">Content Published</option>
            <option value="CONTENT_REJECTED">Content Rejected</option>
            <option value="USER_ROLE_CHANGED">Role Changed</option>
          </select>

          <select
            value={resourceFilter}
            onChange={e => setResourceFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none"
          >
            <option value="all">All Resources</option>
            <option value="Auth">Auth</option>
            <option value="Asset">Asset</option>
            <option value="Content">Content</option>
            <option value="User">User</option>
            <option value="Role">Role</option>
            <option value="Settings">Settings</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Security Telemetry Details</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading audit records...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No audit events match your query.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-white whitespace-nowrap">
                      {log.actorEmail}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`capitalize font-mono text-[10px] ${
                        log.actorRole === 'admin' ? 'text-indigo-400' : 'text-slate-400'
                      }`}>
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-indigo-300 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {log.resourceType}
                    </td>
                    <td className="py-3 px-4 text-slate-200 leading-snug max-w-md">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
          <div>
            Showing Page <strong className="text-white">{pagination.page}</strong> of <strong className="text-white">{pagination.pages}</strong> ({pagination.total} total events)
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => loadLogs(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-50 hover:text-white"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => loadLogs(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-50 hover:text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
