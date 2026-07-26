'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getUser, logout } from '@/lib/api';
import Link from 'next/link';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUserData] = useState<any>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push('/login');
    } else {
      setUserData(u);
    }
  }, [router]);

  if (!user) return null;

  const tabs = [
    { href: '/member/dashboard', label: 'Home', icon: '🏠' },
    { href: '/member/workout', label: 'Workout', icon: '💪' },
    { href: '/member/meals', label: 'Meals', icon: '🍎' },
    { href: '/member/coach', label: 'AI Coach', icon: '🤖' },
    { href: '/member/qr', label: 'QR Pass', icon: '🔲' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center py-6 px-4 relative overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Phone container casing */}
      <div className="w-full max-w-sm h-[780px] bg-slate-900/90 border border-slate-800/80 rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col z-10 backdrop-blur-md">
        
        {/* Top Notch bar status */}
        <div className="w-full h-8 flex justify-between items-center px-8 pt-2 text-[10px] font-bold text-slate-400 select-none bg-slate-950/20 shrink-0 relative">
          <span>9:41</span>
          <div className="w-24 h-4 bg-slate-950 rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0 border-x border-b border-slate-800" />
          <div className="flex gap-1.5">
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>

        {/* Dynamic header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-850 shrink-0">
          <div>
            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Member</h3>
            <h2 className="text-md font-extrabold text-slate-200">{user.name}</h2>
          </div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="text-[10px] text-slate-500 hover:text-red-400 font-bold uppercase tracking-wider transition cursor-pointer"
            title="Log Out"
          >
            Logout
          </button>
        </div>

        {/* Content Pane */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0 bg-slate-900/10 relative">
          {children}
        </div>

        {/* Bottom tab menu navigation */}
        <div className="h-20 border-t border-slate-850 bg-slate-950/90 flex justify-around items-center px-4 shrink-0 rounded-b-[48px]">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-1 transition ${
                  isActive ? 'text-emerald-400 scale-105' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider">{tab.label}</span>
              </Link>
            );
          })}
        </div>

      </div>
    </div>
  );
}
