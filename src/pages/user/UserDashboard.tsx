import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Asset, Content, Share, DashboardStats } from '../../types/index.js';
import { FilePreviewModal } from '../../components/assets/FilePreviewModal.js';
import { 
  FolderLock, 
  UploadCloud, 
  FileText, 
  Share2, 
  HardDrive, 
  Eye, 
  Download, 
  Send,
  Plus,
  Clock
} from 'lucide-react';

interface UserDashboardProps {
  onNavigate: (view: string) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  useEffect(() => {
    Promise.all([
      api.getDashboardStats(),
      api.getAssets({ scope: 'mine', limit: 5 })
    ]).then(([statsRes, assetsRes]) => {
      if (statsRes.success) setStats(statsRes.stats);
      if (assetsRes.success) setRecentAssets(assetsRes.assets);
      setLoading(false);
    });
  }, []);

  const usedMB = ((user?.storageUsed || 0) / (1024 * 1024)).toFixed(1);
  const quotaMB = ((user?.storageQuota || 104857600) / (1024 * 1024)).toFixed(0);
  const percentUsed = Math.min(100, Math.round(((user?.storageUsed || 0) / (user?.storageQuota || 104857600)) * 100));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-slate-400">
            {user?.department || 'Department of Cyber Security'} · Individual Asset Vault &amp; Research Workspace
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('upload-asset')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Asset
          </button>
          <button
            onClick={() => onNavigate('browse-content')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-400" />
            Browse Content
          </button>
        </div>
      </div>

      {/* Quota & Quick KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Storage Quota Card */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              Storage Allocation
            </span>
            <span className="font-mono text-slate-400">{usedMB} / {quotaMB} MB</span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                percentUsed > 85 ? 'bg-rose-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{percentUsed}% capacity used</span>
            <span>{(Number(quotaMB) - Number(usedMB)).toFixed(1)} MB available</span>
          </div>
        </div>

        {/* My Assets KPI */}
        <div 
          onClick={() => onNavigate('my-assets')}
          className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl cursor-pointer transition-colors space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Personal Vault</span>
            <FolderLock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.personalStats?.myAssetsCount ?? recentAssets.length}
          </div>
          <p className="text-[11px] text-slate-400">Digital assets uploaded by you</p>
        </div>

        {/* Submissions KPI */}
        <div 
          onClick={() => onNavigate('my-submissions')}
          className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl cursor-pointer transition-colors space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Research Submissions</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.personalStats?.myPublishedSubmissions ?? 0} Published
          </div>
          <p className="text-[11px] text-slate-400">
            {stats?.personalStats?.myPendingSubmissions ?? 0} pending administrative review
          </p>
        </div>
      </div>

      {/* Recent Personal Uploads */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Personal Uploads</h3>
          <button
            onClick={() => onNavigate('my-assets')}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            View All Assets
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading vault...</div>
        ) : recentAssets.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No assets uploaded yet. Click "Upload Asset" above to store your first file.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-medium border-y border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Visibility</th>
                  <th className="py-2.5 px-3">Uploaded</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentAssets.map(a => (
                  <tr key={a._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      <div 
                        onClick={() => setPreviewAsset(a)}
                        className="hover:text-indigo-400 cursor-pointer truncate max-w-xs"
                      >
                        {a.title}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{a.category}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      {(a.size / (1024 * 1024)).toFixed(2)} MB
                    </td>
                    <td className="py-2.5 px-3 capitalize text-slate-300">{a.visibility}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1">
                      <button
                        onClick={() => setPreviewAsset(a)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={`/api/assets/${a._id}/download`}
                        className="p-1 text-slate-400 hover:text-white inline-block"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FilePreviewModal
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
      />
    </div>
  );
};
