import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.js';
import { Content, AccessRequest } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { 
  CheckSquare, 
  KeyRound, 
  FileText, 
  Check, 
  X, 
  AlertCircle, 
  Eye, 
  Clock,
  User as UserIcon,
  MessageSquare
} from 'lucide-react';

export const Approvals: React.FC = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'content' | 'access'>('content');
  const [pendingContent, setPendingContent] = useState<Content[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Rejection modal
  const [rejectingItem, setRejectingItem] = useState<{ type: 'content' | 'access'; id: string; title: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Reader preview modal
  const [previewContent, setPreviewContent] = useState<Content | null>(null);

  const loadApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const [contentRes, accessRes] = await Promise.all([
        api.getContent({ status: 'pending_review' }),
        api.getAccessRequests('all')
      ]);

      if (contentRes.success) {
        setPendingContent(contentRes.content.filter(c => c.status === 'pending_review'));
      }
      if (accessRes.success) {
        setAccessRequests(accessRes.requests.filter(r => r.status === 'pending'));
      }
    } catch (err: any) {
      error(err.message || 'Failed to load approvals queue');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  const handleApproveContent = async (id: string) => {
    try {
      await api.reviewContent(id, 'approve');
      success('Article approved and published to the institutional catalog.');
      loadApprovals();
    } catch (err: any) {
      error(err.message || 'Approval failed');
    }
  };

  const handleRejectContent = async () => {
    if (!rejectingItem || !rejectionReason.trim()) return;
    try {
      if (rejectingItem.type === 'content') {
        await api.reviewContent(rejectingItem.id, 'reject', rejectionReason.trim());
        success('Submission rejected with feedback transmitted to author.');
      } else {
        await api.reviewAccessRequest(rejectingItem.id, 'reject', rejectionReason.trim());
        success('Access request declined.');
      }
      setRejectingItem(null);
      setRejectionReason('');
      loadApprovals();
    } catch (err: any) {
      error(err.message || 'Action failed');
    }
  };

  const handleApproveAccess = async (id: string) => {
    try {
      await api.reviewAccessRequest(id, 'approve', 'Approved by administrator.');
      success('Access request approved. Peer permissions granted.');
      loadApprovals();
    } catch (err: any) {
      error(err.message || 'Approval failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-indigo-400" />
          Governance &amp; Moderation Approvals Queue
        </h1>
        <p className="text-xs text-slate-400">
          Review peer-submitted research papers and adjudicate restricted asset access requests.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'content'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Content Submissions</span>
          <span className="font-mono text-[11px] px-1.5 py-0.2 bg-slate-800/80 rounded">
            {pendingContent.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('access')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'access'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Restricted Asset Requests</span>
          <span className="font-mono text-[11px] px-1.5 py-0.2 bg-slate-800/80 rounded">
            {accessRequests.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Content Submissions */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading queue...</div>
          ) : pendingContent.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <CheckSquare className="w-10 h-10 text-emerald-500/60 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-white">Review Queue Clean</h3>
              <p className="text-xs text-slate-400 mt-1">There are no pending submissions awaiting review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingContent.map(item => (
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

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => setPreviewContent(item)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg border border-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Article
                      </button>

                      <button
                        onClick={() => handleApproveContent(item._id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve &amp; Publish
                      </button>

                      <button
                        onClick={() => setRejectingItem({ type: 'content', id: item._id, title: item.title })}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-500/30 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    {item.summary}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                      Author: <strong className="text-white">{item.authorName}</strong>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Submitted: {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Access Requests */}
      {activeTab === 'access' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading requests...</div>
          ) : accessRequests.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <KeyRound className="w-10 h-10 text-emerald-500/60 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-white">No Pending Access Requests</h3>
              <p className="text-xs text-slate-400 mt-1">All restricted asset clearance requests have been processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {accessRequests.map(req => (
                <div
                  key={req._id}
                  className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-[11px] text-amber-400 font-medium">Restricted Asset Clearance</div>
                      <h3 className="text-base font-semibold text-white mt-0.5">{req.assetTitle}</h3>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => handleApproveAccess(req._id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Grant Clearance
                      </button>

                      <button
                        onClick={() => setRejectingItem({ type: 'access', id: req._id, title: req.assetTitle })}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-500/30 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Deny
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400">Stated Purpose: </span>
                    <span className="text-slate-200">{req.reason}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>
                      Requester: <strong className="text-white">{req.requesterName}</strong> ({req.requesterEmail})
                    </span>
                    <span>·</span>
                    <span>
                      Submitted: {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rejection / Feedback Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Record Moderation Reason</h3>
              <button onClick={() => setRejectingItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Please provide constructive feedback explaining the decision for <strong className="text-white">{rejectingItem.title}</strong>:
            </div>

            <textarea
              required
              rows={4}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Requires additional threat model analysis and citations..."
              className="w-full p-3 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={!rejectionReason.trim()}
                onClick={handleRejectContent}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reader Modal */}
      {previewContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
              <h3 className="text-sm font-semibold text-white">{previewContent.title}</h3>
              <button onClick={() => setPreviewContent(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-indigo-300">
                <strong>Executive Summary:</strong> {previewContent.summary}
              </div>
              <div>{previewContent.body}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
