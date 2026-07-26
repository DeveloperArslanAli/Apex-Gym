'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/api';

export default function MemberQrPass() {
  const [seconds, setSeconds] = useState(5);
  const [tokenCode, setTokenCode] = useState('MOCK-QR-PASS-TOKEN-XYZ');
  const [user, setUserData] = useState<any>(null);

  useEffect(() => {
    setUserData(getUser());

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          // Generate new dynamic token code
          setTokenCode(`MOCK-QR-PASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-between h-full py-6">
      
      <div className="text-center space-y-1">
        <h4 className="font-extrabold text-sm text-slate-200">Mobile Access Pass</h4>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Dynamic Check-In Security</p>
      </div>

      {/* QR Code Container HUD */}
      <div className="relative p-6 bg-white rounded-3xl shadow-2xl border-4 border-emerald-500/20 my-6 animate-pulse">
        
        {/* Dynamic QR drawing representation using SVG */}
        <svg width="180" height="180" viewBox="0 0 100 100" className="text-slate-900 select-none">
          {/* Outer corners border positioning */}
          <rect x="0" y="0" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
          <rect x="5" y="5" width="15" height="15" fill="currentColor" />
          
          <rect x="75" y="0" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
          <rect x="80" y="5" width="15" height="15" fill="currentColor" />

          <rect x="0" y="75" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
          <rect x="5" y="80" width="15" height="15" fill="currentColor" />

          {/* Random mock QR lines */}
          <rect x="35" y="10" width="10" height="15" fill="currentColor" />
          <rect x="55" y="5" width="12" height="8" fill="currentColor" />
          <rect x="40" y="30" width="20" height="10" fill="currentColor" />
          <rect x="70" y="35" width="10" height="15" fill="currentColor" />
          <rect x="10" y="45" width="25" height="10" fill="currentColor" />
          
          <rect x="30" y="55" width="15" height="20" fill="currentColor" />
          <rect x="60" y="60" width="20" height="20" fill="currentColor" />
          <rect x="85" y="75" width="10" height="10" fill="currentColor" />

          {/* Dynamic center changing dot */}
          <circle cx="50" cy="50" r="8" fill="#10b981" />
        </svg>

        {/* Framing brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-500 pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-500 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-500 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-500 pointer-events-none" />
      </div>

      <div className="text-center space-y-4 max-w-[80%] mx-auto">
        <div className="bg-slate-950/60 border border-slate-850 py-1.5 px-3 rounded-xl inline-flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          <span className="text-[9px] font-mono font-bold text-slate-400">
            Regenerating pass: {seconds}s
          </span>
        </div>

        <p className="text-[10px] text-slate-500 leading-relaxed">
          Align this QR Code in the reader camera at the gym entrance kiosk. Backup entry triggers if face or fingerprint checks are offline.
        </p>

        {user && (
          <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl text-left text-[9px]">
            <p className="font-bold text-slate-400 uppercase tracking-widest mb-1">Pass Credentials</p>
            <p className="text-slate-500">Holder: {user.name}</p>
            <p className="text-slate-500 truncate">Token: {tokenCode}</p>
          </div>
        )}
      </div>

    </div>
  );
}
