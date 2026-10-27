import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { api } from '../../services/api.js';
import { Notification } from '../../types/index.js';
import { 
  Bell, 
  ShieldCheck, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  BookOpen, 
  Check, 
  ExternalLink,
  Lock,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, activeView, setActiveView }) => {
  const { user, logout, login } = useAuth();
  const { success, error } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDemoSwitcherOpen, setIsDemoSwitcherOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {}
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (link) {
        const viewName = link.replace(/^\/(admin|user)\//, '');
        setActiveView(viewName);
        setIsNotifOpen(false);
      }
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      success('All notifications marked as read.');
    } catch {}
  };

  const handleSwitchAccount = async (email: string) => {
    try {
      await login({ email, password: 'CyberSec@2026!' });
      success(`Switched session to ${email}`);
      setIsDemoSwitcherOpen(false);
      setIsProfileOpen(false);
      // Route appropriately
      if (email.includes('admin')) {
        setActiveView('dashboard');
      } else {
        setActiveView('user-dashboard');
      }
    } catch (err: any) {
      error(err.message || 'Failed to switch demo account');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-slate-900 border-b border-slate-800 text-white">
      {/* Left: Brand & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={() => setActiveView(user?.role === 'admin' ? 'dashboard' : 'user-dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600 text-white shadow-sm group-hover:bg-indigo-500 transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>SecureCMS</span>
              <span className="text-[11px] font-mono text-indigo-400">RBAC</span>
            </div>
            <div className="text-[11px] text-slate-400 font-normal hidden sm:block">
              Cyber Security Asset & Content Vault
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Project Docs View Button (Crucial for College Evaluators) */}
        <button
          onClick={() => setActiveView('project-docs')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
            activeView === 'project-docs'
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
          }`}
          title="Inspect Academic Review Documentation & Architecture"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Project Docs &amp; ERD</span>
        </button>

        {/* Quick Demo Account Switcher (Instant evaluator convenience) */}
        <div className="relative">
          <button
            onClick={() => setIsDemoSwitcherOpen(!isDemoSwitcherOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 transition-colors"
            title="Fast switch between Administrator, Reviewer, and Student roles"
          >
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="hidden md:inline">Demo Roles</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isDemoSwitcherOpen && (
            <div className="absolute right-0 mt-2 w-64 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 text-xs">
              <div className="px-2 py-1.5 font-semibold text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                Instant Role Switching
              </div>
              <div className="py-1 space-y-1">
                <button
                  onClick={() => handleSwitchAccount('admin@cms.cybersec.edu')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    user?.email === 'admin@cms.cybersec.edu' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-medium">System Administrator</div>
                    <div className="text-[10px] text-slate-400">Prof. Marcus Vance</div>
                  </div>
                  {user?.email === 'admin@cms.cybersec.edu' && <Check className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => handleSwitchAccount('reviewer@cms.cybersec.edu')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    user?.email === 'reviewer@cms.cybersec.edu' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-medium">Content Reviewer</div>
                    <div className="text-[10px] text-slate-400">Elena Rostova</div>
                  </div>
                  {user?.email === 'reviewer@cms.cybersec.edu' && <Check className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => handleSwitchAccount('alice.smith@cms.cybersec.edu')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    user?.email === 'alice.smith@cms.cybersec.edu' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-medium">Student / Researcher</div>
                    <div className="text-[10px] text-slate-400">Alice Smith (Forensics)</div>
                  </div>
                  {user?.email === 'alice.smith@cms.cybersec.edu' && <Check className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => handleSwitchAccount('bob.martinez@cms.cybersec.edu')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    user?.email === 'bob.martinez@cms.cybersec.edu' ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-medium">Student / Researcher</div>
                    <div className="text-[10px] text-slate-400">Bob Martinez (Crypto)</div>
                  </div>
                  {user?.email === 'bob.martinez@cms.cybersec.edu' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            aria-label="View notifications"
            className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 text-xs">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                <span className="font-semibold text-white">Notifications ({unreadCount} unread)</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 my-1">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">No notifications yet</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n._id}
                      onClick={() => handleMarkAsRead(n._id, n.link)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        n.isRead ? 'hover:bg-slate-800/40 text-slate-400' : 'bg-slate-800/60 hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 text-left rounded-lg hover:bg-slate-800 transition-colors"
          >
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`}
              alt={user?.name}
              className="w-7 h-7 rounded-full bg-slate-700 object-cover"
            />
            <div className="hidden lg:block text-xs">
              <div className="font-medium text-white leading-none">{user?.name}</div>
              <div className="text-[11px] text-slate-400 capitalize">{user?.role}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 p-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <div className="font-medium text-white">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="mt-1 text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">
                  Role: {user?.role}
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveView('profile');
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Profile &amp; Settings</span>
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
