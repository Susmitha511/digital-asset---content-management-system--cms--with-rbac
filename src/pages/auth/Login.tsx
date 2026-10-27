import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { ShieldCheck, Lock, Mail, ArrowRight, KeyRound, Sparkles } from 'lucide-react';

interface LoginProps {
  onNavigateToRegister: () => void;
  onNavigateToForgot: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigateToRegister, onNavigateToForgot }) => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      success('Authenticated successfully. Welcome back!');
    } catch (err: any) {
      error(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('CyberSec@2026!');
    setSubmitting(true);
    try {
      await login({ email: demoEmail, password: 'CyberSec@2026!' });
      success(`Signed in as ${demoEmail}`);
    } catch (err: any) {
      error(err.message || 'Demo login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 mb-1">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Digital Asset &amp; Content Management
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Role-Based Access Control (RBAC) &amp; Cyber Security Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@cms.cybersec.edu"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={onNavigateToForgot}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-colors disabled:opacity-50"
            >
              <span>{submitting ? 'Verifying Credentials...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Logins for College Evaluators */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Project Reviewer 1-Click Access</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@cms.cybersec.edu')}
                className="p-2 text-left bg-slate-800/60 hover:bg-indigo-950/40 border border-slate-700/60 hover:border-indigo-500/50 rounded-lg transition-all"
              >
                <div className="font-medium text-indigo-300">Administrator</div>
                <div className="text-[10px] text-slate-400 truncate">Prof. Marcus Vance</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('reviewer@cms.cybersec.edu')}
                className="p-2 text-left bg-slate-800/60 hover:bg-indigo-950/40 border border-slate-700/60 hover:border-indigo-500/50 rounded-lg transition-all"
              >
                <div className="font-medium text-emerald-300">Lead Reviewer</div>
                <div className="text-[10px] text-slate-400 truncate">Elena Rostova</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('alice.smith@cms.cybersec.edu')}
                className="p-2 text-left bg-slate-800/60 hover:bg-indigo-950/40 border border-slate-700/60 hover:border-indigo-500/50 rounded-lg transition-all"
              >
                <div className="font-medium text-sky-300">Student (Alice)</div>
                <div className="text-[10px] text-slate-400 truncate">Forensics Lab</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('bob.martinez@cms.cybersec.edu')}
                className="p-2 text-left bg-slate-800/60 hover:bg-indigo-950/40 border border-slate-700/60 hover:border-indigo-500/50 rounded-lg transition-all"
              >
                <div className="font-medium text-amber-300">Student (Bob)</div>
                <div className="text-[10px] text-slate-400 truncate">Crypto Lab</div>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pt-1">
            Don't have an institutional account?{' '}
            <button
              onClick={onNavigateToRegister}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Register here
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <div>Protected by HTTP-only JWT cookies, Helmet, and server-side RBAC.</div>
          <div>B.E. Computer Science &amp; Engineering Final-Year Academic Project.</div>
        </div>
      </div>
    </div>
  );
};
