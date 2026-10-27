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
  LayoutGrid, 
  List, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  FileText, 
  Image as ImageIcon, 
  Share2, 
  UploadCloud,
  X
} from 'lucide-react';

interface AssetManagementProps {
  onNavigateToUpload: () => void;
}

export const AssetManagement: React.FC<AssetManagementProps> = ({ onNavigateToUpload }) => {
  const { success, error } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showTrash, setShowTrash] = useState(false);

  // Modals
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [shareTargetAsset, setShareTargetAsset] = useState<Asset | null>(null);
  const [deleteTargetAsset, setDeleteTargetAsset] = useState<Asset | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);

  // Edit metadata modal
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
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
        api.getAssets({
          search,
          category: categoryFilter,
          type: typeFilter,
          visibility: visibilityFilter,
          includeDeleted: showTrash,
          limit: 100
        }),
        api.getCategories()
      ]);

      if (assetsRes.success) {
        setAssets(assetsRes.assets);
      }
      if (catRes.success) {
        setCategories(catRes.categories);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, typeFilter, visibilityFilter, showTrash, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteTargetAsset) return;
    try {
      await api.deleteAsset(deleteTargetAsset._id, isPermanentDelete);
      success(isPermanentDelete ? 'Asset permanently purged' : 'Asset moved to trash');
      setDeleteTargetAsset(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Delete operation failed');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.restoreAsset(id);
      success('Asset restored successfully');
      loadData();
    } catch (err: any) {
      error(err.message || 'Restore failed');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAsset) return;
    try {
      await api.updateAsset(editAsset._id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        tags: editForm.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
        visibility: editForm.visibility
      });
      success('Asset metadata updated successfully');
      setEditAsset(null);
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
            Digital Asset Vault
          </h1>
          <p className="text-xs text-slate-400">
            Enterprise digital materials, cryptographic diagrams, and classified specifications.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowTrash(!showTrash)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              showTrash
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {showTrash ? 'Viewing Trash' : 'Trash Bin'}
          </button>

          <button
            onClick={onNavigateToUpload}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            Upload New Asset
          </button>
        </div>
      </div>

      {/* Filter and View Controls */}
      <div className="flex flex-col lg:flex-row gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, description, original filename, or tags..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="image">Images &amp; SVGs</option>
            <option value="pdf">PDF Documents</option>
            <option value="document">Text &amp; Documents</option>
            <option value="media">Audio &amp; Media</option>
          </select>

          <select
            value={visibilityFilter}
            onChange={e => setVisibilityFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none"
          >
            <option value="all">All Visibilities</option>
            <option value="public">Public</option>
            <option value="restricted">Restricted</option>
            <option value="private">Private</option>
          </select>

          <div className="flex items-center p-1 bg-slate-800 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Asset Content: Grid vs List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : assets.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <FolderLock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No Digital Assets Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {showTrash ? 'Trash bin is empty.' : 'No digital assets match your selected filters.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map(asset => {
            const isImage = asset.mimeType.startsWith('image/');
            const formattedSize = (asset.size / (1024 * 1024)).toFixed(2) + ' MB';

            return (
              <div
                key={asset._id}
                className="group flex flex-col justify-between bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-xs transition-all"
              >
                {/* Visual Thumbnail */}
                <div 
                  onClick={() => setPreviewAsset(asset)}
                  className="relative h-44 bg-slate-950/80 cursor-pointer overflow-hidden flex items-center justify-center border-b border-slate-800"
                >
                  {isImage ? (
                    <img
                      src={`/api/assets/${asset._id}/preview`}
                      alt={asset.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-indigo-400 transition-colors">
                      <FileText className="w-10 h-10 stroke-[1.5]" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        {asset.mimeType.split('/')[1] || 'DOC'}
                      </span>
                    </div>
                  )}

                  {/* Clean unboxed metadata kicker */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/90 backdrop-blur-md text-[10px] font-medium text-slate-300 capitalize border border-slate-700/60">
                    <span>{asset.visibility}</span>
                  </div>
                </div>

                {/* Details */}
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
                      {asset.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Clean unboxed metadata line */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[120px]">{asset.category}</span>
                    <span>{formattedSize}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewAsset(asset)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Preview Asset"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={`/api/assets/${asset._id}/download`}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Authorized Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => setShareTargetAsset(asset)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Peer Share"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setEditAsset(asset);
                          setEditForm({
                            title: asset.title,
                            description: asset.description,
                            category: asset.category,
                            tags: asset.tags.join(', '),
                            visibility: asset.visibility
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Metadata"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {showTrash ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRestore(asset._id)}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Restore"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTargetAsset(asset);
                            setIsPermanentDelete(true);
                          }}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Permanently Purge"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setDeleteTargetAsset(asset);
                          setIsPermanentDelete(false);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-medium border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {assets.map(asset => (
                  <tr key={asset._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg text-indigo-400 shrink-0">
                          {asset.mimeType.startsWith('image/') ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div>
                          <div 
                            onClick={() => setPreviewAsset(asset)}
                            className="font-semibold text-white hover:text-indigo-400 cursor-pointer"
                          >
                            {asset.title}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{asset.originalName}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">{asset.category}</td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {(asset.size / (1024 * 1024)).toFixed(2)} MB
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap capitalize text-slate-300">{asset.visibility}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">{asset.ownerName}</td>

                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => setPreviewAsset(asset)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-md"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={`/api/assets/${asset._id}/download`}
                        className="p-1.5 text-slate-400 hover:text-white rounded-md inline-block"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => setShareTargetAsset(asset)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-md"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTargetAsset(asset);
                          setIsPermanentDelete(showTrash);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <FilePreviewModal
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
        onShare={a => {
          setPreviewAsset(null);
          setShareTargetAsset(a);
        }}
      />

      {/* Share Modal */}
      <ShareModal
        asset={shareTargetAsset}
        onClose={() => setShareTargetAsset(null)}
        onShared={loadData}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteTargetAsset !== null}
        title={isPermanentDelete ? 'Permanently Purge Asset?' : 'Move Asset to Trash?'}
        message={
          isPermanentDelete
            ? `Are you sure you want to permanently delete "${deleteTargetAsset?.title}"? The physical file will be unlinked from server storage.`
            : `Move "${deleteTargetAsset?.title}" to trash? You can restore it anytime.`
        }
        confirmLabel={isPermanentDelete ? 'Permanently Delete' : 'Move to Trash'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetAsset(null)}
      />

      {/* Edit Metadata Modal */}
      {editAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Edit Asset Metadata</h3>
              <button onClick={() => setEditAsset(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Asset Title</label>
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
                    <option value="public">Public</option>
                    <option value="restricted">Restricted</option>
                    <option value="private">Private</option>
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
                  onClick={() => setEditAsset(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
