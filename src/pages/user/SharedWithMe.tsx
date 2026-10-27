import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Asset, Share } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { FilePreviewModal } from '../../components/assets/FilePreviewModal.js';
import { Share2, Download, Eye, FileText, User as UserIcon, Calendar } from 'lucide-react';

export const SharedWithMe: React.FC = () => {
  const { error } = useToast();
  const [shares, setShares] = useState<(Share & { asset: Asset })[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  useEffect(() => {
    api.getSharedWithMe().then(res => {
      if (res.success) setShares(res.shares);
      setLoading(false);
    }).catch(err => {
      error(err.message || 'Failed to load shared assets');
      setLoading(false);
    });
  }, [error]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-indigo-400" />
          Assets Shared With Me
        </h1>
        <p className="text-xs text-slate-400">
          Digital assets and documents colleagues and faculty have granted you access to.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading shared files...</div>
      ) : shares.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Share2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No Shared Assets</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            When colleagues or administrators share digital assets with your account, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shares.map(share => {
            const asset = share.asset;
            if (!asset) return null;
            const formattedSize = (asset.size / (1024 * 1024)).toFixed(2) + ' MB';

            return (
              <div
                key={share._id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider">
                      {asset.category}
                    </span>
                    <span className="text-[11px] font-medium text-emerald-400 capitalize">
                      {share.permission} access
                    </span>
                  </div>

                  <h3 
                    onClick={() => setPreviewAsset(asset)}
                    className="font-semibold text-sm text-white hover:text-indigo-400 cursor-pointer transition-colors"
                  >
                    {asset.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {asset.description || 'No description.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                    Shared by <strong className="text-white">{share.sharedByName}</strong>
                  </span>
                  <span>{formattedSize}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                  <button
                    onClick={() => setPreviewAsset(asset)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>

                  <a
                    href={`/api/assets/${asset._id}/download`}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FilePreviewModal
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
      />
    </div>
  );
};
