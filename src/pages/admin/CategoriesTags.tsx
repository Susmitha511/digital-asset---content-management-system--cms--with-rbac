import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.js';
import { Category } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { Tags, Plus, Edit3, Trash2, X, FolderLock } from 'lucide-react';

export const CategoriesTags: React.FC = () => {
  const { success, error } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6'
  });

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCategories();
      if (res.success) setCategories(res.categories);
    } catch (err: any) {
      error(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCategory(formData);
      success(`Category "${formData.name}" created.`);
      setIsCreateOpen(false);
      setFormData({ name: '', description: '', color: '#3b82f6' });
      loadCategories();
    } catch (err: any) {
      error(err.message || 'Failed to create category');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      await api.updateCategory(editingCategory._id, formData);
      success('Category updated successfully.');
      setEditingCategory(null);
      loadCategories();
    } catch (err: any) {
      error(err.message || 'Failed to update category');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteCategory(deleteTarget._id, 'General');
      success(`Category "${deleteTarget.name}" deleted. Any attached assets reassigned to "General".`);
      setDeleteTarget(null);
      loadCategories();
    } catch (err: any) {
      error(err.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Tags className="w-5 h-5 text-indigo-400" />
            Security Asset Taxonomies &amp; Categories
          </h1>
          <p className="text-xs text-slate-400">
            Structure digital materials into managed classification buckets with referential integrity.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ name: '', description: '', color: '#3b82f6' });
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div
              key={cat._id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: cat.color || '#6366f1' }} 
                    />
                    <h3 className="font-semibold text-sm text-white">{cat.name}</h3>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">
                    {cat.assetCount || 0} Assets
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {cat.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] text-slate-400">slug: /{cat.slug}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setFormData({
                        name: cat.name,
                        description: cat.description || '',
                        color: cat.color || '#3b82f6'
                      });
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-md"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(isCreateOpen || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button 
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingCategory(null);
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingCategory ? handleUpdate : handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Incident Response Artifacts"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Purpose of this category bucket..."
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    className="w-10 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-400">{formData.color}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation with Reassignment Note */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white">Delete Category "{deleteTarget.name}"?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deleting this category will preserve referential integrity: any assets currently tagged with this category will be automatically reassigned to <strong>"General"</strong>.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg">
                Delete &amp; Reassign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
