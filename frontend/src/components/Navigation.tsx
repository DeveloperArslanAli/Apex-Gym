'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUser, logout } from '@/lib/api';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUserData] = useState<any>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push('/login');
    } else {
      setUserData(u);
    }
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/members', label: 'Members', icon: '👥' },
    { href: '/kiosk', label: 'Kiosk Sim', icon: '📱' },
  ];

  return (
    <>
      {/* Sidebar for Desktop */}
      <nav className="bg-slate-950 border-r border-slate-800 text-slate-100 w-64 min-h-screen p-5 flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <span className="text-3xl">⚡</span>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Antigravity</h1>
              <p className="text-[10px] tracking-wider text-slate-500 uppercase font-bold">Gym Operations</p>
            </div>
          </div>

          <div className="space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="font-medium text-sm">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-900 pt-4 px-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-sm text-slate-200">{user.name}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-slate-900 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🚪</span> Log Out
          </button>
        </div>
      </nav>

      {/* Top Header for Mobile */}
      <header className="bg-slate-950 border-b border-slate-800 text-slate-100 p-4 flex items-center justify-between md:hidden w-full">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <h1 className="font-extrabold text-md tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Antigravity</h1>
        </div>
        <div className="flex gap-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                  isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button onClick={handleLogout} className="text-xs text-red-400 ml-2">🚪</button>
        </div>
      </header>
    </>
  );
}
