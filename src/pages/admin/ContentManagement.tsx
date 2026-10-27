import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.js';
import { Content, Category } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { 
  FileText, 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  X,
  User as UserIcon,
  Calendar
} from 'lucide-react';

export const ContentManagement: React.FC = () => {
  const { success, error } = useToast();
  const [contents, setContents] = useState<Content[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [selectedArticle, setSelectedArticle] = useState<Content | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Content | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    body: '',
    category: 'Research Papers & Specs',
    tags: '',
    submitForReview: true
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [contentRes, catRes] = await Promise.all([
        api.getContent({
          search,
          status: statusFilter,
          category: categoryFilter,
          limit: 50
        }),
        api.getCategories()
      ]);

      if (contentRes.success) setContents(contentRes.content);
      if (catRes.success) setCategories(catRes.categories);
    } catch (err: any) {
      error(err.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createContent({
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      success('Content article created.');
      setIsCreateOpen(false);
      setFormData({
        title: '',
        summary: '',
        body: '',
        category: 'Research Papers & Specs',
        tags: '',
        submitForReview: true
      });
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to create article');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContent) return;
    try {
      await api.updateContent(editingContent._id, {
        title: formData.title,
        summary: formData.summary,
        body: formData.body,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      success('Article updated successfully.');
      setEditingContent(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to update article');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this article?')) return;
    try {
      await api.deleteContent(id);
      success('Content removed.');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete content');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Institutional Content &amp; Publications
          </h1>
          <p className="text-xs text-slate-400">
            Author, moderate, and publish technical security guidelines and research whitepapers.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              title: '',
              summary: '',
              body: '',
              category: categories[0]?.name || 'Research Papers & Specs',
              tags: '',
              submitForReview: true
            });
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Publication
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search publications by title, abstract, or tags..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="pending_review">Pending Review</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
          </select>

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
      </div>

      {/* Publications Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-medium border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Publication Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading publications...</td>
                </tr>
              ) : contents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No publications found.</td>
                </tr>
              ) : (
                contents.map(item => (
                  <tr key={item._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 max-w-sm">
                      <div 
                        onClick={() => setSelectedArticle(item)}
                        className="font-semibold text-white hover:text-indigo-400 cursor-pointer truncate"
                      >
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{item.summary}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">{item.category}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">{item.authorName}</td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`capitalize font-medium ${
                        item.status === 'published'
                          ? 'text-emerald-400'
                          : item.status === 'pending_review'
                          ? 'text-amber-400'
                          : item.status === 'rejected'
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => setSelectedArticle(item)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-md"
                        title="Read Publication"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingContent(item);
                          setFormData({
                            title: item.title,
                            summary: item.summary,
                            body: item.body,
                            category: item.category,
                            tags: item.tags.join(', '),
                            submitForReview: true
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-md"
                        title="Edit Article"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                {selectedArticle.category}
              </span>
              <button onClick={() => setSelectedArticle(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">{selectedArticle.title}</h2>

              <div className="flex items-center gap-3 text-xs text-slate-400 border-b border-slate-800/80 pb-3">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5" /> {selectedArticle.authorName}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {new Date(selectedArticle.createdAt).toLocaleDateString()}
                </span>
                <span>·</span>
                <span className="capitalize">{selectedArticle.status.replace('_', ' ')}</span>
              </div>

              {selectedArticle.rejectionReason && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                  <strong>Moderation Feedback:</strong> {selectedArticle.rejectionReason}
                </div>
              )}

              <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {selectedArticle.body}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(isCreateOpen || editingContent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white">
                {editingContent ? 'Edit Security Publication' : 'Draft New Publication'}
              </h3>
              <button 
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingContent(null);
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingContent ? handleUpdate : handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Article Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Formal Analysis of Zero-Trust Protocol Gateways"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  {categories.map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Executive Summary</label>
                <textarea
                  rows={2}
                  required
                  value={formData.summary}
                  onChange={e => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Concise abstract of the publication..."
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Publication Body</label>
                <textarea
                  rows={6}
                  required
                  value={formData.body}
                  onChange={e => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Full publication text or Markdown document..."
                  className="w-full p-3 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="zero-trust, cryptography, compliance"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingContent(null);
                  }}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
                >
                  {editingContent ? 'Update Article' : 'Publish / Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
