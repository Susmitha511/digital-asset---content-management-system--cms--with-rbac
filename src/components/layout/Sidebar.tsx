import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { 
  LayoutDashboard, 
  Users, 
  FolderLock, 
  FileText, 
  CheckSquare, 
  Tags, 
  ShieldAlert, 
  BarChart3, 
  ScrollText, 
  Settings, 
  UploadCloud, 
  Share2, 
  KeyRound, 
  Send, 
  Bell, 
  UserCircle, 
  HardDrive,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, onClose }) => {
  const { user, isAdmin, isEditor } = useAuth();

  const handleSelectView = (view: string) => {
    setActiveView(view);
    onClose();
  };

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'assets', label: 'Digital Assets Vault', icon: FolderLock },
    { id: 'content', label: 'Content Management', icon: FileText },
    { id: 'approvals', label: 'Approvals Queue', icon: CheckSquare },
    { id: 'categories', label: 'Categories & Tags', icon: Tags },
    { id: 'roles', label: 'Roles & Permissions', icon: ShieldAlert },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'audit-logs', label: 'Security Audit Logs', icon: ScrollText },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const userNav = [
    { id: 'user-dashboard', label: 'My Workspace', icon: LayoutDashboard },
    { id: 'my-assets', label: 'My Uploaded Assets', icon: FolderLock },
    { id: 'browse-content', label: 'Browse Published Content', icon: FileText },
    { id: 'upload-asset', label: 'Upload New Asset', icon: UploadCloud },
    { id: 'shared-with-me', label: 'Shared With Me', icon: Share2 },
    { id: 'access-requests', label: 'Access Requests', icon: KeyRound },
    { id: 'my-submissions', label: 'My Submissions', icon: Send },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile & Security', icon: UserCircle },
  ];

  // Storage calculation
  const usedMB = ((user?.storageUsed || 0) / (1024 * 1024)).toFixed(1);
  const quotaMB = ((user?.storageQuota || 104857600) / (1024 * 1024)).toFixed(0);
  const percentUsed = Math.min(100, Math.round(((user?.storageUsed || 0) / (user?.storageQuota || 104857600)) * 100));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Workspace badge */}
          <div className="px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Administrator Portal' : isEditor ? 'Editorial Reviewer Portal' : 'User Workspace'}
            </div>
            <div className="text-xs text-white font-medium mt-0.5 truncate">
              {user?.department || 'Department of Cyber Security'}
            </div>
          </div>

          {/* Navigation group */}
          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {isAdmin || isEditor ? 'System Administration' : 'Asset Management'}
            </div>

            {(isAdmin || isEditor ? adminNav : userNav).map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectView(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Academic Project Documentation Link */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={() => handleSelectView('project-docs')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                activeView === 'project-docs'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-indigo-300 hover:text-white hover:bg-indigo-950/40'
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Project Review Docs</span>
            </button>
          </div>
        </div>

        {/* Storage Quota Footer */}
        <div className="p-3 m-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs">
          <div className="flex items-center justify-between text-slate-300 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              Storage Quota
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {usedMB} / {quotaMB} MB
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                percentUsed > 90 ? 'bg-rose-500' : percentUsed > 70 ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <div className="mt-1 text-[10px] text-slate-400 text-right">
            {percentUsed}% capacity utilized
          </div>
        </div>
      </aside>
    </>
  );
};
