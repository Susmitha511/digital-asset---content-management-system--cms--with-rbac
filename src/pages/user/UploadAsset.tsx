import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api.js';
import { Category } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Lock, 
  Eye, 
  ShieldCheck,
  HardDrive
} from 'lucide-react';

interface UploadAssetProps {
  onUploadComplete: () => void;
}

export const UploadAsset: React.FC<UploadAssetProps> = ({ onUploadComplete }) => {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Research Papers & Specs',
    tags: '',
    visibility: 'private'
  });

  useEffect(() => {
    api.getCategories().then(res => {
      if (res.success && res.categories.length > 0) {
        setCategories(res.categories);
        setFormData(prev => ({ ...prev, category: res.categories[0].name }));
      }
    });
  }, []);

  const handleFile = (file: File) => {
    // 50MB check
    if (file.size > 50 * 1024 * 1024) {
      error('File exceeds the organizational maximum limit of 50 MB.');
      return;
    }

    // Check user quota
    if (user && user.storageUsed + file.size > user.storageQuota) {
      error(`Uploading this file would exceed your storage quota (${(user.storageQuota / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    setSelectedFile(file);
    if (!formData.title) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setFormData(prev => ({ ...prev, title: nameWithoutExt }));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      error('Please select a file to upload.');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('file', selectedFile);
      data.append('title', formData.title.trim() || selectedFile.name);
      data.append('description', formData.description.trim());
      data.append('category', formData.category);
      data.append('tags', formData.tags);
      data.append('visibility', formData.visibility);

      await api.uploadAsset(data);
      success(`"${formData.title || selectedFile.name}" stored securely in digital vault.`);
      await refreshUser();
      onUploadComplete();
    } catch (err: any) {
      error(err.message || 'File upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-indigo-400" />
          Secure Digital Asset Ingestion
        </h1>
        <p className="text-xs text-slate-400">
          Upload documents, cryptographic specifications, diagrams, and research assets into the encrypted vault.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-950/20'
              : selectedFile
              ? 'border-emerald-500/50 bg-slate-900'
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {selectedFile ? (
            <div className="flex flex-col items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
              <div className="font-semibold text-sm text-white">{selectedFile.name}</div>
              <div className="text-xs text-slate-400 font-mono">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · {selectedFile.type || 'Binary Data'}
              </div>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="mt-2 text-xs text-rose-400 hover:text-rose-300"
              >
                Change selected file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-white">
                Drag and drop your asset file, or <span className="text-indigo-400">browse</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Supported: PDF, Images (PNG, JPG, SVG, WebP), Documents, JSON, Markdown, Audio/Video (up to 50 MB)
              </p>
            </div>
          )}
        </div>

        {/* Metadata Fields */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-white">Asset Classification &amp; Metadata</h3>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Asset Display Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. NIST Zero Trust Compliance Matrix"
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Summary of contents, methodology, or threat indicators..."
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Security Category</label>
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Visibility Policy</label>
              <select
                value={formData.visibility}
                onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
              >
                <option value="private">Private (Only Accessible to You)</option>
                <option value="restricted">Restricted (Peers must submit access request)</option>
                <option value="public">Public (Open institutional read access)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              placeholder="cryptography, zero-trust, report"
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !selectedFile}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-colors disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{submitting ? 'Encrypting & Storing File...' : 'Upload & Catalog Asset'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
