import React, { useState } from 'react';
import { Asset } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { X, KeyRound, AlertTriangle } from 'lucide-react';

interface RequestAccessModalProps {
  asset: Asset | null;
  onClose: () => void;
  onRequestSubmitted?: () => void;
}

export const RequestAccessModal: React.FC<RequestAccessModalProps> = ({ asset, onClose, onRequestSubmitted }) => {
  const { success, error } = useToast();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      await api.requestAccess(asset._id, reason.trim());
      success('Access request submitted to asset owner.');
      if (onRequestSubmitted) onRequestSubmitted();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to submit access request');
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
            <KeyRound className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Request Restricted Asset Access</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-amber-200/90 leading-relaxed">
              This asset is marked as <strong className="text-white">Restricted</strong>. Please provide an academic or research justification to the owner ({asset.ownerName}).
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Justification / Purpose for Access
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g., Required for laboratory review and cryptanalysis verification..."
              className="w-full p-3 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
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
              disabled={submitting || !reason.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
