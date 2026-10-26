import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BrainCircuit, Lock, Mail, User as UserIcon, Phone, ArrowRight, Sparkles, KeyRound } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoLogin } = useAuth();

  const isRegisterInitial = location.pathname.includes('register');
  const [isRegister, setIsRegister] = useState(isRegisterInitial);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isForgotPassword) {
        if (!newPassword) {
          const res = await api.forgotPassword(email);
          setSuccessMsg(res.message);
        } else {
          const res = await api.resetPassword({ email, newPassword });
          setSuccessMsg(res.message);
          setIsForgotPassword(false);
        }
      } else if (isRegister) {
        const res = await api.register({ email, password, name, phone });
        if (res.success && res.token && res.user) {
          login(res.token, res.user);
          navigate('/dashboard');
        }
      } else {
        const res = await api.login({ email, password });
        if (res.success && res.token && res.user) {
          login(res.token, res.user);
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200/90 shadow-elevated">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-700 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-md">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isForgotPassword
              ? 'Reset Account Password'
              : isRegister
              ? 'Create Candidate Account'
              : 'Sign in to AI Career Assistant'}
          </h2>
          <p className="text-xs text-slate-500">
            {isForgotPassword
              ? 'Enter your registered email to update credentials'
              : isRegister
              ? 'For students, freshers, and experienced job seekers'
              : 'Access your saved jobs, ATS reports, and interview history'}
          </p>
        </div>

        {/* 1-Click Demo Buttons for Fast Evaluation */}
        {!isForgotPassword && (
          <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-200/80 space-y-2">
            <p className="text-[11px] font-bold text-brand-900 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Instant 1-Click Demo Logins:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  demoLogin('CANDIDATE');
                  navigate('/dashboard');
                }}
                className="btn-secondary text-[11px] py-1.5 font-bold hover:bg-white"
              >
                Demo Candidate
              </button>
              <button
                type="button"
                onClick={() => {
                  demoLogin('ADMIN');
                  navigate('/admin');
                }}
                className="btn-secondary text-[11px] py-1.5 font-bold hover:bg-white text-amber-800 border-amber-200"
              >
                Demo Admin
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="input-field pl-9"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="input-field pl-9"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Password
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[11px] text-brand-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-9"
                />
              </div>
            </div>
          )}

          {isForgotPassword && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                New Password (Enter to update)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New strong password"
                  className="input-field pl-9"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {errorMsg}
            </p>
          )}

          {successMsg && (
            <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
              {successMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-sm shadow-md flex items-center justify-center space-x-1"
          >
            <span>
              {loading
                ? 'Processing...'
                : isForgotPassword
                ? 'Update Password'
                : isRegister
                ? 'Create Account'
                : 'Sign In'}
            </span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        {/* Footer Switcher */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          {isForgotPassword ? (
            <button
              onClick={() => setIsForgotPassword(false)}
              className="text-brand-600 font-semibold hover:underline"
            >
              Back to Sign In
            </button>
          ) : isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setIsRegister(false)}
                className="text-brand-600 font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New to AI Career Assistant?{' '}
              <button
                onClick={() => setIsRegister(true)}
                className="text-brand-600 font-semibold hover:underline"
              >
                Sign Up for Free
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
