'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
      <div className="flex flex-col items-center gap-4">
        <span className="text-3xl animate-spin text-emerald-400">⚡</span>
        <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Initializing Antigravity System...</p>
      </div>
    </main>
  );
}
