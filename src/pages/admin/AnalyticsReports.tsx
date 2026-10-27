import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { DashboardStats } from '../../types/index.js';
import { BarChart3, Download, HardDrive, Users, FolderLock, FileText, ArrowDownToLine } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';

const COLORS = ['#4f46e5', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export const AnalyticsReports: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats().then(res => {
      if (res.success) setStats(res.stats);
      setLoading(false);
    });
  }, []);

  const handleExportCsv = () => {
    window.location.href = '/api/audit-logs/export-csv';
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Institutional Analytics &amp; Compliance Reports
          </h1>
          <p className="text-xs text-slate-400">
            Storage consumption distribution, ingestion velocity, and regulatory audit summaries.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Export Audit Trail (CSV)
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Total Storage Used</div>
          <div className="text-xl font-bold text-white font-mono">
            {(stats.totalStorageUsed / (1024 * 1024)).toFixed(2)} MB
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all categories</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Total Cataloged Assets</div>
          <div className="text-xl font-bold text-white font-mono">{stats.totalAssets}</div>
          <div className="text-[11px] text-slate-400 mt-1">Active digital resources</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Total Publications</div>
          <div className="text-xl font-bold text-white font-mono">{stats.totalContent}</div>
          <div className="text-[11px] text-slate-400 mt-1">{stats.publishedContent} Published Articles</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Total Authorized Users</div>
          <div className="text-xl font-bold text-white font-mono">{stats.totalUsers}</div>
          <div className="text-[11px] text-slate-400 mt-1">{stats.activeUsers} Active Accounts</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Storage Consumption */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-white">Storage Consumption by Category (KB)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryDistribution.map(c => ({ name: c.name, sizeKB: Math.round(c.size / 1024) }))}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={v => v.split(' ')[0]} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="sizeKB" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* File Type Distribution */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-white">MIME Type &amp; Media Breakdown</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.fileTypeDistribution}>
                <XAxis dataKey="type" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.fileTypeDistribution.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
