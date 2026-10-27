import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Notification } from '../../types/index.js';
import { useToast } from '../../context/ToastContext.js';
import { Bell, Check, Clock, CheckCheck, Info, AlertTriangle, AlertCircle } from 'lucide-react';

interface NotificationsViewProps {
  onNavigate: (view: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const { success, error } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      if (res.success) setNotifications(res.notifications);
    } catch (err: any) {
      error(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: string, link?: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      if (link) {
        const view = link.replace(/^\/(admin|user)\//, '');
        onNavigate(view);
      }
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      success('All notifications marked as read.');
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            Security &amp; Workflow Notifications
          </h1>
          <p className="text-xs text-slate-400">
            System alerts, approval status updates, and peer sharing events.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark All Read
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">Inbox Zero</h3>
          <p className="text-xs text-slate-400 mt-1">You have no new notifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n._id}
              onClick={() => handleMarkRead(n._id, n.link)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                n.isRead
                  ? 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40 text-slate-400'
                  : 'bg-slate-900 border-indigo-500/30 hover:border-indigo-500/60 text-slate-200'
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-800 shrink-0 mt-0.5">
                {n.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : n.type === 'alert' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                ) : n.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <Info className="w-4 h-4 text-sky-400" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-white">{n.title}</h4>
                  <span className="text-[10px] text-slate-500">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
