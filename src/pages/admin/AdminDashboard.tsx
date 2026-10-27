import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { DashboardStats } from '../../types/index.js';
import { 
  Users, 
  FolderLock, 
  HardDrive, 
  CheckSquare, 
  FileText, 
  ShieldCheck, 
  ArrowUpRight, 
  DownloadCloud, 
  UploadCloud, 
  UserPlus, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

const CATEGORY_COLORS = ['#4f46e5', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const res = await api.getDashboardStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const storageUsedMB = (stats.totalStorageUsed / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">System Governance &amp; RBAC Console</h1>
            <span className="text-xs font-mono text-emerald-400">Zero-Trust Active</span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time digital asset catalog, storage enforcement, and immutable cryptographic audit stream.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('upload-asset')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Asset
          </button>

          <button
            onClick={() => onNavigate('users')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-slate-400" />
            Provision User
          </button>

          <button
            onClick={() => onNavigate('approvals')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <CheckSquare className="w-4 h-4 text-amber-400" />
            Approvals ({stats.pendingApprovals + stats.pendingAccessRequests})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Registered Users</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{stats.totalUsers}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            {stats.activeUsers} Active · 0 Suspended
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Digital Assets Vault</span>
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg">
              <FolderLock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{stats.totalAssets}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            Across {stats.categoryDistribution.length} categories
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Encrypted Storage</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{storageUsedMB} MB</div>
          <div className="mt-1 text-[11px] text-slate-400">
            Server Disk Allocation
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Review Queue</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            {stats.pendingApprovals + stats.pendingAccessRequests}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {stats.pendingApprovals} articles · {stats.pendingAccessRequests} access reqs
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Trends Chart */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">7-Day Asset Ingestion Volume</h3>
              <p className="text-[11px] text-slate-400">Telemetry of newly uploaded and cataloged assets</p>
            </div>
            <span className="text-[11px] font-mono text-indigo-400">Daily Volume</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.uploadTrends}>
                <defs>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="uploads" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorUploads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Assets by Security Category</h3>
              <p className="text-[11px] text-slate-400">Taxonomic distribution of stored digital materials</p>
            </div>
            <button 
              onClick={() => onNavigate('categories')} 
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Manage
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryDistribution}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(val) => val.split(' ')[0]} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.categoryDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Recent Security Audit Events</h3>
          </div>
          <button
            onClick={() => onNavigate('audit-logs')}
            className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View Full Audit Trail</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-medium border-y border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Resource</th>
                <th className="py-2.5 px-3">Security Telemetry Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {stats.recentActivity.map(log => (
                <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-white whitespace-nowrap">
                    {log.actorEmail}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-300 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {log.resourceType}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 leading-snug">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
