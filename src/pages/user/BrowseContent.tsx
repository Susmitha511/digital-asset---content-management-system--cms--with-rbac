import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.js';
import { Content, Category } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { FileText, Search, Eye, Calendar, User as UserIcon, Tag, X, ArrowRight } from 'lucide-react';

export const BrowseContent: React.FC = () => {
  const { error } = useToast();
  const [contents, setContents] = useState<Content[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Reader Modal
  const [readingArticle, setReadingArticle] = useState<Content | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [contentRes, catRes] = await Promise.all([
        api.getContent({ status: 'published', search, category: categoryFilter, limit: 50 }),
        api.getCategories()
      ]);

      if (contentRes.success) setContents(contentRes.content);
      if (catRes.success) setCategories(catRes.categories);
    } catch (err: any) {
      error(err.message || 'Failed to load published content');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          Browse Institutional Technical Publications
        </h1>
        <p className="text-xs text-slate-400">
          Peer-reviewed security analyses, protocol specifications, and cyber forensics research.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search published articles, abstracts, or tags..."
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

      {/* Content Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading publications...</div>
      ) : contents.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No Published Articles</h3>
          <p className="text-xs text-slate-400 mt-1">Check back later or adjust your category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contents.map(item => (
            <div
              key={item._id}
              onClick={() => setReadingArticle(item)}
              className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl shadow-xs cursor-pointer flex flex-col justify-between space-y-4 transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                    {item.category}
                  </span>
                  <span className="text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {item.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  {item.authorName}
                </span>

                <span className="inline-flex items-center gap-1 text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">
                  Read Full Paper <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reader Modal */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                {readingArticle.category}
              </span>
              <button onClick={() => setReadingArticle(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h2 className="text-lg font-bold text-white leading-snug">{readingArticle.title}</h2>

              <div className="flex items-center gap-4 text-xs text-slate-400 border-b border-slate-800 pb-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <UserIcon className="w-3.5 h-3.5" /> {readingArticle.authorName}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {new Date(readingArticle.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-indigo-200/90 leading-relaxed font-sans">
                <strong className="text-white block mb-1">Abstract:</strong>
                {readingArticle.summary}
              </div>

              <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap pt-2">
                {readingArticle.body}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
