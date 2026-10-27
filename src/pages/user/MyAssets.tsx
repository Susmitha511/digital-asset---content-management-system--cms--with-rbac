import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.js';
import { Asset, Category } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { FilePreviewModal } from '../../components/assets/FilePreviewModal.js';
import { ShareModal } from '../../components/assets/ShareModal.js';
import { ConfirmationModal } from '../../components/common/ConfirmationModal.js';
import { 
  FolderLock, 
  Search, 
  UploadCloud, 
  Eye, 
  Download, 
  Share2, 
  Edit3, 
  Trash2, 
  FileText, 
  Image as ImageIcon,
  X
} from 'lucide-react';

interface MyAssetsProps {
  onNavigateToUpload: () => void;
}

export const MyAssets: React.FC<MyAssetsProps> = ({ onNavigateToUpload }) => {
  const { success, error } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [shareAsset, setShareAsset] = useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

  // Edit metadata modal
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    visibility: 'private' as any
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assetsRes, catRes] = await Promise.all([
        api.getAssets({ scope: 'mine', search, category: categoryFilter, limit: 100 }),
        api.getCategories()
      ]);

      if (assetsRes.success) setAssets(assetsRes.assets);
      if (catRes.success) setCategories(catRes.categories);
    } catch (err: any) {
      error(err.message || 'Failed to load your assets');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteAsset(deleteTarget._id, false);
      success('Asset deleted successfully');
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete asset');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    try {
      await api.updateAsset(editingAsset._id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        tags: editForm.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
        visibility: editForm.visibility
      });
      success('Metadata updated.');
      setEditingAsset(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to update asset');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-indigo-400" />
            My Uploaded Digital Assets
          </h1>
          <p className="text-xs text-slate-400">
            Private and shared documents, forensic captures, and diagrams under your ownership.
          </p>
        </div>

        <button
          onClick={onNavigateToUpload}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          Upload New File
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search personal files by title or tags..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c._id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading your vault...</div>
      ) : assets.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <FolderLock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No Personal Assets</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You haven't uploaded any digital assets yet. Use the Upload New File button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map(asset => {
            const isImage = asset.mimeType.startsWith('image/');
            const formattedSize = (asset.size / (1024 * 1024)).toFixed(2) + ' MB';

            return (
              <div
                key={asset._id}
                className="group flex flex-col justify-between bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-xs transition-all"
              >
                <div 
                  onClick={() => setPreviewAsset(asset)}
                  className="relative h-40 bg-slate-950/80 cursor-pointer overflow-hidden flex items-center justify-center border-b border-slate-800"
                >
                  {isImage ? (
                    <img
                      src={`/api/assets/${asset._id}/preview`}
                      alt={asset.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-500">
                      <FileText className="w-8 h-8 stroke-[1.5]" />
                      <span className="text-[10px] font-mono uppercase text-slate-400">
                        {asset.mimeType.split('/')[1] || 'FILE'}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-slate-900/90 text-[10px] font-medium text-slate-300 capitalize border border-slate-700/60">
                    {asset.visibility}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 
                      onClick={() => setPreviewAsset(asset)}
                      className="font-semibold text-xs text-white hover:text-indigo-400 cursor-pointer transition-colors line-clamp-1"
                      title={asset.title}
                    >
                      {asset.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {asset.description || 'No description.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[120px]">{asset.category}</span>
                    <span>{formattedSize}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewAsset(asset)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-md"
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={`/api/assets/${asset._id}/download`}
                        className="p-1.5 text-slate-400 hover:text-white rounded-md inline-block"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => setShareAsset(asset)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-md"
                        title="Share with Colleague"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setEditingAsset(asset);
                          setEditForm({
                            title: asset.title,
                            description: asset.description,
                            category: asset.category,
                            tags: asset.tags.join(', '),
                            visibility: asset.visibility
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-md"
                        title="Edit Metadata"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => setDeleteTarget(asset)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <FilePreviewModal
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
        onShare={a => {
          setPreviewAsset(null);
          setShareAsset(a);
        }}
      />

      <ShareModal
        asset={shareAsset}
        onClose={() => setShareAsset(null)}
        onShared={loadData}
      />

      <ConfirmationModal
        isOpen={deleteTarget !== null}
        title="Delete Personal Asset?"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? You will reclaim ${(Number(deleteTarget?.size || 0) / (1024 * 1024)).toFixed(2)} MB of your storage quota.`}
        confirmLabel="Delete Asset"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Edit Metadata Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Edit Asset Metadata</h3>
              <button onClick={() => setEditingAsset(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    {categories.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Visibility</label>
                  <select
                    value={editForm.visibility}
                    onChange={e => setEditForm({ ...editForm, visibility: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="private">Private (Only You)</option>
                    <option value="restricted">Restricted (Require Approval)</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={e => setEditForm({ ...editForm, tags: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
                >
                  Save Metadata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
