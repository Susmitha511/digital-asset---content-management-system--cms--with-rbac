import React, { useState } from 'react';
import { Asset } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { X, Share2, Mail, Shield, Check } from 'lucide-react';

interface ShareModalProps {
  asset: Asset | null;
  onClose: () => void;
  onShared?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ asset, onClose, onShared }) => {
  const { success, error } = useToast();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'download' | 'edit'>('download');
  const [submitting, setSubmitting] = useState(false);

  if (!asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return;

    setSubmitting(true);
    try {
      await api.shareAsset({
        assetId: asset._id,
        recipientEmail: recipientEmail.trim(),
        permission
      });
      success(`Asset shared successfully with ${recipientEmail}`);
      if (onShared) onShared();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to share asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div 
        onClick={e => e.stopPropagation()} 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Share Digital Asset</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Target Asset: </span>
            <span className="font-medium text-white truncate block">{asset.title}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Recipient Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                placeholder="colleague@cms.cybersec.edu"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Demo users: alice.smith@cms.cybersec.edu, bob.martinez@cms.cybersec.edu
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Access Permission Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['view', 'download', 'edit'] as const).map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPermission(p)}
                  className={`p-2.5 rounded-lg border text-xs capitalize transition-all ${
                    permission === p
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {permission === p && <Check className="w-3 h-3 text-indigo-400" />}
                    <span>{p}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Sharing...' : 'Confirm Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
