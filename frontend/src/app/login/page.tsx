'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken, setUser, fetchApi } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await fetchApi('auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setToken(data.access_token);
      setUser(data.user);

      // Route based on role
      if (data.user.role === 'MEMBER') {
        setError('Members must use the mobile app. Administrative portal access only.');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-slate-950 text-slate-100 flex-col items-center justify-center relative px-4 overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 animate-pulse">
            <span className="text-3xl text-slate-950 font-bold">⚡</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1">Gym Operations & Biometrics Administration</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl mb-6">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@gym.com"
              required
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white placeholder-slate-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white placeholder-slate-600 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-sm transition shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-3">Seeded Demo Accounts</p>
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="bg-slate-950/50 border border-slate-800/50 p-2.5 rounded-lg">
              <p className="text-[10px] font-bold text-emerald-400">Super Admin (Owner)</p>
              <p className="text-[9px] text-slate-400">Email: admin@gym.com</p>
              <p className="text-[9px] text-slate-400">Pass: Admin@123</p>
            </div>
            <div className="bg-slate-950/50 border border-slate-800/50 p-2.5 rounded-lg">
              <p className="text-[10px] font-bold text-cyan-400">Receptionist Staff</p>
              <p className="text-[9px] text-slate-400">Email: staff@gym.com</p>
              <p className="text-[9px] text-slate-400">Pass: Staff@123</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
