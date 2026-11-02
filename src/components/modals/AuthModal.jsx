import React, { useState } from 'react';
import { User, Lock, Mail, Loader2, ArrowRight, X, ShieldCheck } from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  theme = 'light',
}) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = mode === 'login' ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.token) {
        localStorage.setItem('nexus_session_token', data.token);
      }

      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#FAF9F5] dark:bg-[#15161A] border border-[#E3E5DF] dark:border-[#272A32] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E3E5DF] dark:border-[#272A32] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#287D54]/10 dark:bg-emerald-500/15 border border-[#287D54]/25 dark:border-emerald-500/25 flex items-center justify-center text-[#287D54] dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#242824] dark:text-[#F4F4F5]">
                {mode === 'login' ? 'Sign in to Nexus Vault' : 'Create Your Vault Account'}
              </h3>
              <p className="text-xs text-[#666B65] dark:text-[#A1A1AA]">
                {mode === 'login'
                  ? 'Access your private notes and knowledge graph'
                  : 'Get a private, cryptographically isolated workspace'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#878C85] hover:text-[#242824] dark:hover:text-[#F4F4F5] rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-2 p-1 bg-[#E8EAE4] dark:bg-[#1C1C22] rounded-xl text-xs font-medium">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#2A2B33] text-[#242824] dark:text-[#F4F4F5] shadow-xs font-semibold'
                  : 'text-[#666B65] dark:text-[#A1A1AA] hover:text-[#242824]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#2A2B33] text-[#242824] dark:text-[#F4F4F5] shadow-xs font-semibold'
                  : 'text-[#666B65] dark:text-[#A1A1AA] hover:text-[#242824]'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#242824] dark:text-[#D4D4D8]">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#878C85] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E3E5DF] dark:border-[#272A32] bg-white dark:bg-[#1A1B20] text-[#242824] dark:text-[#F4F4F5] placeholder-[#878C85] focus:outline-none focus:ring-1 focus:ring-[#287D54]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#242824] dark:text-[#D4D4D8]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#878C85] absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@university.edu"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E3E5DF] dark:border-[#272A32] bg-white dark:bg-[#1A1B20] text-[#242824] dark:text-[#F4F4F5] placeholder-[#878C85] focus:outline-none focus:ring-1 focus:ring-[#287D54]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#242824] dark:text-[#D4D4D8]">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#878C85] absolute left-3 top-2.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E3E5DF] dark:border-[#272A32] bg-white dark:bg-[#1A1B20] text-[#242824] dark:text-[#F4F4F5] placeholder-[#878C85] focus:outline-none focus:ring-1 focus:ring-[#287D54]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#287D54] hover:bg-[#1F6342] text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In' : 'Create Free Vault'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="px-6 py-3.5 border-t border-[#E3E5DF] dark:border-[#272A32] bg-[#F0F1ED] dark:bg-[#111113] flex items-center justify-between text-xs text-[#666B65] dark:text-[#A1A1AA]">
          <span>Exploring without an account?</span>
          <button
            onClick={onClose}
            className="text-[#287D54] dark:text-emerald-400 hover:underline font-medium cursor-pointer"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
