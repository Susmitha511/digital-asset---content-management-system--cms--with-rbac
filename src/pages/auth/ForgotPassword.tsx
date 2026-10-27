import React, { useState } from 'react';
import { api } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { ShieldCheck, Mail, ArrowLeft, ArrowRight, KeyRound } from 'lucide-react';

interface ForgotPasswordProps {
  onNavigateToLogin: () => void;
  onNavigateToReset: (token?: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigateToLogin, onNavigateToReset }) => {
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetTokenReceived, setResetTokenReceived] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    try {
      const res = await api.forgotPassword(email.trim().toLowerCase());
      success(res.message);
      if (res.demoResetToken) {
        setResetTokenReceived(res.demoResetToken);
      }
    } catch (err: any) {
      error(err.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-lg mb-1">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Reset Account Password</h1>
          <p className="text-xs text-slate-400">Time-limited single-use cryptographic token generator</p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-5">
          {!resetTokenReceived ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@cms.cybersec.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-colors disabled:opacity-50"
              >
                <span>{submitting ? 'Generating Token...' : 'Send Reset Instructions'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs space-y-2">
                <div className="font-semibold text-emerald-400">Cryptographic Token Generated</div>
                <div className="text-slate-300">
                  In production, this token is dispatched via SMTP. For reviewer convenience, the generated token is provided below:
                </div>
                <div className="p-2 bg-slate-950 font-mono text-[11px] text-indigo-300 break-all rounded border border-slate-800">
                  {resetTokenReceived}
                </div>
              </div>

              <button
                onClick={() => onNavigateToReset(resetTokenReceived)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-colors"
              >
                <span>Proceed to Password Reset</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="pt-2 text-center">
            <button
              onClick={onNavigateToLogin}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
