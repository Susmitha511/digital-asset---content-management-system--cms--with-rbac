import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.js';
import { AccessRequest } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { KeyRound, Check, X, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';

export const AccessRequests: React.FC = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [sentRequests, setSentRequests] = useState<AccessRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const [sentRes, recRes] = await Promise.all([
        api.getAccessRequests('sent'),
        api.getAccessRequests('received')
      ]);

      if (sentRes.success) setSentRequests(sentRes.requests);
      if (recRes.success) setReceivedRequests(recRes.requests);
    } catch (err: any) {
      error(err.message || 'Failed to load access requests');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.reviewAccessRequest(id, action, action === 'approve' ? 'Approved by owner' : 'Declined by owner');
      success(`Request ${action === 'approve' ? 'approved' : 'declined'}`);
      loadRequests();
    } catch (err: any) {
      error(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-indigo-400" />
          Restricted Asset Access Clearances
        </h1>
        <p className="text-xs text-slate-400">
          Track clearance requests you have submitted and review peer requests for your restricted files.
        </p>
      </div>

      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'sent' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          My Submitted Requests ({sentRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeTab === 'received' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Received Requests for My Files ({receivedRequests.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading requests...</div>
      ) : activeTab === 'sent' ? (
        sentRequests.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <KeyRound className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">No Submitted Requests</h3>
            <p className="text-xs text-slate-400 mt-1">
              You haven't requested clearance for any restricted digital assets.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sentRequests.map(r => (
              <div
                key={r._id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm text-white">{r.assetTitle}</h3>
                  <span className={`capitalize text-xs font-medium ${
                    r.status === 'approved' ? 'text-emerald-400' : r.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    Status: {r.status}
                  </span>
                </div>

                <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Your Justification: </span>
                  {r.reason}
                </div>

                {r.reviewNote && (
                  <div className="text-xs text-indigo-300 bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-500/20">
                    <strong>Owner Feedback:</strong> {r.reviewNote}
                  </div>
                )}

                <div className="text-[11px] text-slate-400">
                  Requested on {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        receivedRequests.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <KeyRound className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">No Received Requests</h3>
            <p className="text-xs text-slate-400 mt-1">
              No one has requested access to your restricted assets at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {receivedRequests.map(r => (
              <div
                key={r._id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm text-white">{r.assetTitle}</h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Requested by <strong className="text-white">{r.requesterName}</strong> ({r.requesterEmail})
                    </div>
                  </div>

                  {r.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReview(r._id, 'approve')}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(r._id, 'reject')}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-500/30"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>
                  ) : (
                    <span className="capitalize text-xs font-medium text-slate-400">
                      Resolved: {r.status}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Justification: </span>
                  {r.reason}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
