import React, { useState } from 'react';
import { Wallet, Shield, Zap, ArrowRight, User, Mail, Lock, ChevronLeft, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AuthProps {
  onLogin: (name: string, sessionUser?: any) => void;
}

type AuthMode = 'login' | 'signup' | 'reset';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } }
        });
        if (error) throw error;
        onLogin(name || data.user?.user_metadata?.name || 'User', data.user);
      } else if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin(data.user?.user_metadata?.name || 'User', data.user);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        alert('Password reset link sent to ' + email);
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-indigo-600 rounded-[28px] mx-auto flex items-center justify-center shadow-2xl shadow-indigo-600/40 animate-bounce-slow">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tighter">BalanceBook Pro</h1>
            <p className="text-slate-500 font-bold text-sm">Wealth Management Simplified</p>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl p-8 rounded-[40px] border border-slate-800/50 shadow-2xl space-y-6">
          {mode !== 'reset' && (
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/50 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-3 rounded-xl text-xs font-black transition-all ${mode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`py-3 rounded-xl text-xs font-black transition-all ${mode === 'signup' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Create Account
              </button>
            </div>
          )}

          {mode === 'reset' && (
            <button 
              onClick={() => setMode('login')}
              className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Login
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nick Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    required
                    type="text"
                    placeholder="e.g. Infas"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-5 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none text-white font-bold focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  required
                  type="email"
                  placeholder="infas@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-5 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none text-white font-bold focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-5 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none text-white font-bold focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                <div className="relative group">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-5 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl outline-none text-white font-bold focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>
            )}

            {error && <p className="text-[10px] font-black text-rose-500 uppercase text-center bg-rose-500/10 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all mt-4 hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'} 
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <div className="text-center">
              <button 
                onClick={() => setMode('reset')}
                className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-400 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}
        </div>

        <div className="text-center space-y-4 opacity-60">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center justify-center gap-2">
            Created by <span className="text-white">Infas</span> From <a href="https://webbits.space" className="text-indigo-400 underline">Web Bits</a>
          </p>
          <div className="flex items-center justify-center gap-3">
             <div className="h-px w-8 bg-slate-800" />
             <Zap className="w-3 h-3 text-indigo-500" />
             <span className="text-[8px] font-black uppercase tracking-[0.2em]">AWT TEAM POWERED</span>
             <div className="h-px w-8 bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
