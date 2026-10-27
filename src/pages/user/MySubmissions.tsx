import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.js';
import { Content, Category } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { Send, Plus, Eye, Edit3, X, Calendar, AlertTriangle } from 'lucide-react';

export const MySubmissions: React.FC = () => {
  const { success, error } = useToast();
  const [submissions, setSubmissions] = useState<Content[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [viewArticle, setViewArticle] = useState<Content | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    body: '',
    category: 'Research Papers & Specs',
    tags: '',
    submitForReview: true
  });

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const [contentRes, catRes] = await Promise.all([
        api.getContent({ scope: 'mine', limit: 50 }),
        api.getCategories()
      ]);

      if (contentRes.success) setSubmissions(contentRes.content);
      if (catRes.success) setCategories(catRes.categories);
    } catch (err: any) {
      error(err.message || 'Failed to load your submissions');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createContent({
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      success('Research article submitted for administrative review.');
      setIsSubmitOpen(false);
      setFormData({
        title: '',
        summary: '',
        body: '',
        category: categories[0]?.name || 'Research Papers & Specs',
        tags: '',
        submitForReview: true
      });
      loadSubmissions();
    } catch (err: any) {
      error(err.message || 'Failed to submit article');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-400" />
            My Research &amp; Content Submissions
          </h1>
          <p className="text-xs text-slate-400">
            Submit whitepapers, advisories, and findings for review and publication.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Submit New Article
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading your submissions...</div>
      ) : submissions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Send className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No Submissions Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Draft and submit technical analyses to the editorial board using the button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {submissions.map(item => (
            <div
              key={item._id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <h3 className="text-base font-semibold text-white mt-0.5">{item.title}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`capitalize text-xs font-medium ${
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

                  <button
                    onClick={() => setViewArticle(item)}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {item.summary}
              </p>

              {item.status === 'rejected' && item.rejectionReason && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Reviewer Feedback:</strong> {item.rejectionReason}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-400">
                Submitted on {new Date(item.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reader Modal */}
      {viewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
              <h3 className="text-sm font-semibold text-white">{viewArticle.title}</h3>
              <button onClick={() => setViewArticle(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <strong className="text-white block mb-1">Abstract:</strong>
                {viewArticle.summary}
              </div>
              <div>{viewArticle.body}</div>
            </div>
          </div>
        </div>
      )}

      {/* Submit New Article Modal */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Submit Research for Review</h3>
              <button onClick={() => setIsSubmitOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Publication Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Evaluating Post-Quantum Lattice Key Exchange Protocols"
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Executive Summary / Abstract</label>
                <textarea
                  rows={2}
                  required
                  value={formData.summary}
                  onChange={e => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Key research questions, methodology, and conclusions..."
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Article Content</label>
                <textarea
                  rows={6}
                  required
                  value={formData.body}
                  onChange={e => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Complete text, proofs, or technical guidelines..."
                  className="w-full p-3 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="cryptography, algorithms, quantum"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
                >
                  Submit for Administrative Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
