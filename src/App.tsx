import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';

// Layout
import { Navbar } from './components/layout/Navbar.js';
import { Sidebar } from './components/layout/Sidebar.js';

// Auth Pages
import { Login } from './pages/auth/Login.js';
import { Register } from './pages/auth/Register.js';
import { ForgotPassword } from './pages/auth/ForgotPassword.js';
import { ResetPassword } from './pages/auth/ResetPassword.js';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { UserManagement } from './pages/admin/UserManagement.js';
import { AssetManagement } from './pages/admin/AssetManagement.js';
import { ContentManagement } from './pages/admin/ContentManagement.js';
import { Approvals } from './pages/admin/Approvals.js';
import { CategoriesTags } from './pages/admin/CategoriesTags.js';
import { RolesPermissions } from './pages/admin/RolesPermissions.js';
import { AnalyticsReports } from './pages/admin/AnalyticsReports.js';
import { AuditLogs } from './pages/admin/AuditLogs.js';
import { SystemSettings } from './pages/admin/SystemSettings.js';

// User Pages
import { UserDashboard } from './pages/user/UserDashboard.js';
import { MyAssets } from './pages/user/MyAssets.js';
import { BrowseContent } from './pages/user/BrowseContent.js';
import { UploadAsset } from './pages/user/UploadAsset.js';
import { SharedWithMe } from './pages/user/SharedWithMe.js';
import { AccessRequests } from './pages/user/AccessRequests.js';
import { MySubmissions } from './pages/user/MySubmissions.js';
import { NotificationsView } from './pages/user/NotificationsView.js';
import { ProfileSettings } from './pages/user/ProfileSettings.js';

// Academic Project Review Documentation
import { ProjectDocsView } from './pages/docs/ProjectDocsView.js';

function MainApp() {
  const { user, loading, isAdmin, isEditor } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [resetToken, setResetToken] = useState<string>('');
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync initial view based on role
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setActiveView('dashboard');
      } else if (user.role === 'editor') {
        setActiveView('approvals');
      } else {
        setActiveView('user-dashboard');
      }
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <div className="text-xs text-slate-400 font-mono">Initializing Zero-Trust Secure Vault...</div>
        </div>
      </div>
    );
  }

  // Unauthenticated Flow
  if (!user) {
    if (authView === 'register') {
      return <Register onNavigateToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot') {
      return (
        <ForgotPassword
          onNavigateToLogin={() => setAuthView('login')}
          onNavigateToReset={(token) => {
            if (token) setResetToken(token);
            setAuthView('reset');
          }}
        />
      );
    }
    if (authView === 'reset') {
      return (
        <ResetPassword
          initialToken={resetToken}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <Login
        onNavigateToRegister={() => setAuthView('register')}
        onNavigateToForgot={() => setAuthView('forgot')}
      />
    );
  }

  // Authenticated Portal View Routing
  const renderCurrentView = () => {
    // Academic Project Documentation
    if (activeView === 'project-docs') {
      return <ProjectDocsView />;
    }

    // Common/Cross-role Views
    if (activeView === 'upload-asset') {
      return (
        <UploadAsset
          onUploadComplete={() => {
            if (isAdmin || isEditor) setActiveView('assets');
            else setActiveView('my-assets');
          }}
        />
      );
    }
    if (activeView === 'profile') {
      return <ProfileSettings />;
    }
    if (activeView === 'notifications') {
      return <NotificationsView onNavigate={setActiveView} />;
    }
    if (activeView === 'browse-content') {
      return <BrowseContent />;
    }

    // Admin & Editor Modules
    if (isAdmin || isEditor) {
      switch (activeView) {
        case 'dashboard':
          return <AdminDashboard onNavigate={setActiveView} />;
        case 'users':
          return <UserManagement />;
        case 'assets':
          return <AssetManagement onNavigateToUpload={() => setActiveView('upload-asset')} />;
        case 'content':
          return <ContentManagement />;
        case 'approvals':
          return <Approvals />;
        case 'categories':
          return <CategoriesTags />;
        case 'roles':
          return <RolesPermissions />;
        case 'analytics':
          return <AnalyticsReports />;
        case 'audit-logs':
          return <AuditLogs />;
        case 'settings':
          return <SystemSettings />;
        default:
          return <AdminDashboard onNavigate={setActiveView} />;
      }
    }

    // Standard User Modules
    switch (activeView) {
      case 'user-dashboard':
        return <UserDashboard onNavigate={setActiveView} />;
      case 'my-assets':
        return <MyAssets onNavigateToUpload={() => setActiveView('upload-asset')} />;
      case 'shared-with-me':
        return <SharedWithMe />;
      case 'access-requests':
        return <AccessRequests />;
      case 'my-submissions':
        return <MySubmissions />;
      default:
        return <UserDashboard onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 p-4 md:p-8 lg:ml-64 overflow-y-auto min-h-[calc(100vh-4rem)]">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
