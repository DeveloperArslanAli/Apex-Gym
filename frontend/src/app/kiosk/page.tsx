'use client';

import { useEffect, useRef, useState } from 'react';
import Navigation from '@/components/Navigation';
import { fetchApi } from '@/lib/api';

export default function KioskPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [method, setMethod] = useState<'FACE' | 'FINGERPRINT' | 'QR'>('FACE');
  
  // Scan Animation States
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; name?: string; plan?: string } | null>(null);
  
  // Camera simulation
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  // Mock Hardware Bridge status
  const [relayStatus, setRelayStatus] = useState<'LOCKED' | 'OPENING' | 'OPEN' | 'CLOSED'>('LOCKED');

  useEffect(() => {
    // Load members list
    const loadMembers = async () => {
      try {
        const data = await fetchApi('members');
        setMembers(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadMembers();
  }, []);

  // WebRTC camera startup
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      }
    } catch (err) {
      console.warn('Camera blocked or unavailable, falling back to mock placeholder', err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (method === 'FACE') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [method]);

  const handleScanTrigger = async () => {
    if (!selectedMemberId) return;
    setScanning(true);
    setResult(null);

    // Simulate scan delay
    setTimeout(async () => {
      try {
        const member = members.find((m) => m.id === selectedMemberId);
        
        // Trigger verification endpoint (acting as Kiosk device client)
        const response = await fetchApi('checkins/verify', {
          method: 'POST',
          body: JSON.stringify({
            memberId: member.id,
            method: method,
            photoUrl: method === 'FACE' ? 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200' : null,
          }),
        });

        if (response.authorized) {
          setResult({
            success: true,
            message: 'Access Granted. Welcome!',
            name: response.memberName,
            plan: response.planName,
          });

          // Trigger Mock Gate Relay ESP32
          setRelayStatus('OPENING');
          setTimeout(() => {
            setRelayStatus('OPEN');
            setTimeout(() => {
              setRelayStatus('CLOSED');
              setTimeout(() => setRelayStatus('LOCKED'), 1000);
            }, 3000); // Keep open for 3s
          }, 800);
        } else {
          setResult({
            success: false,
            message: response.reason || 'Verification Failed',
            name: response.memberName,
          });
        }
      } catch (err: any) {
        setResult({
          success: false,
          message: err.message || 'System mismatch error',
        });
      } finally {
        setScanning(false);
      }
    }, 1500); // 1.5s scan time
  };

  return (
    <div className="flex bg-slate-950 text-slate-100 min-h-screen">
      <Navigation />

      <main className="flex-1 p-5 md:p-8 overflow-y-auto relative flex flex-col">
        {/* Gradients */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 blur-[130px] rounded-full pointer-events-none" />

        <div className="mb-6">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Entry Kiosk Terminal</h2>
          <p className="text-xs text-slate-400 mt-1">Simulate entrance gate hardware authentication and door relay triggers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-stretch">
          {/* Viewfinder Column */}
          <div className="lg:col-span-7 bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 flex flex-col items-center justify-between min-h-[480px] relative overflow-hidden">
            
            {/* Relay Status Indicator Overlay */}
            <div className="absolute top-4 left-4 z-20">
              <span className={`text-[10px] uppercase font-bold tracking-widest px-3.5 py-1.5 rounded-full border ${
                relayStatus === 'LOCKED' ? 'bg-slate-950/80 text-slate-400 border-slate-800' :
                relayStatus === 'OPENING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/10 animate-pulse' :
                relayStatus === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]' :
                'bg-red-500/10 text-red-400 border-red-500/10'
              }`}>
                Relay Relay Gate: {relayStatus}
              </span>
            </div>

            {/* Verification Method Toggle */}
            <div className="flex gap-2 bg-slate-950/80 border border-slate-850 p-1.5 rounded-2xl relative z-10 w-max mb-6">
              {(['FACE', 'FINGERPRINT', 'QR'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMethod(m);
                    setResult(null);
                  }}
                  className={`text-[10px] uppercase font-bold tracking-wider px-4 py-2 rounded-xl transition cursor-pointer ${
                    method === m ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m === 'FACE' ? '👤 Facial' : m === 'FINGERPRINT' ? '☝️ Finger' : '📱 QR Code'}
                </button>
              ))}
            </div>

            {/* Viewfinder Screen Container */}
            <div className="w-72 h-72 rounded-full border-2 border-slate-800 relative bg-slate-950 overflow-hidden flex items-center justify-center shadow-2xl">
              
              {/* Scan Overlay Lines */}
              {scanning && (
                <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_10px_rgba(16,185,129,1)] z-10 animate-[bounce_1.5s_infinite]" />
              )}

              {result && (
                <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm ${
                  result.success ? 'bg-emerald-950/80 border border-emerald-500/20' : 'bg-red-950/80 border border-red-500/20'
                }`}>
                  <span className="text-5xl mb-4">{result.success ? '💚' : '❌'}</span>
                  <h4 className="text-lg font-black">{result.success ? 'Access Granted' : 'Access Denied'}</h4>
                  {result.name && <p className="text-sm font-semibold mt-1 text-slate-200">{result.name}</p>}
                  {result.plan && <p className="text-[10px] text-slate-400 mt-0.5">Plan: {result.plan}</p>}
                  <p className="text-[11px] text-slate-300 mt-3">{result.message}</p>
                </div>
              )}

              {/* Video elements or Mock Viewfinders */}
              {method === 'FACE' ? (
                cameraActive ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover scale-x-[-1]"
                    muted
                    playsInline
                  />
                ) : (
                  <div className="text-center text-slate-600 relative z-0">
                    <span className="text-5xl block mb-2">📷</span>
                    <p className="text-[10px]">FACIAL VIEWPORT</p>
                  </div>
                )
              ) : method === 'FINGERPRINT' ? (
                <div className="text-center relative z-0 flex flex-col items-center">
                  <span className={`text-6xl mb-3 block transition duration-300 ${scanning ? 'text-emerald-400 scale-115' : 'text-slate-700'}`}>☝️</span>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Scanner Glass ready</p>
                </div>
              ) : (
                <div className="text-center relative z-0 flex flex-col items-center">
                  <span className={`text-5xl mb-3 block transition duration-300 ${scanning ? 'text-emerald-400 scale-105 animate-pulse' : 'text-slate-700'}`}>🔲</span>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Hold QR in frame</p>
                </div>
              )}

              {/* Corner brackets details for premium HUD design */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-slate-700 pointer-events-none" />
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-slate-700 pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-slate-700 pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-slate-700 pointer-events-none" />
            </div>

            {/* HUD Status label */}
            <div className="text-center mt-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {scanning ? 'SCANNING BIOMETRICS...' : result ? 'READY FOR NEXT SCAN' : 'WAITING FOR INPUT MATCH'}
              </p>
            </div>
          </div>

          {/* Trigger Controller Panel */}
          <div className="lg:col-span-5 bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-slate-200 mb-2">Simulate Access Scan</h3>
              <p className="text-xs text-slate-400 mb-6">Choose a member from the database to trigger a biometric scan emulation</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Gym Member ID</label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => {
                      setSelectedMemberId(e.target.value);
                      setResult(null);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-300 transition"
                  >
                    <option value="">Select Member...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email}) - {m.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-2 text-xs">
                  <p className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-2">Selected Profile Status</p>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account status:</span>
                    <span className="font-semibold text-slate-300">
                      {members.find((m) => m.id === selectedMemberId)?.status || 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Biometrics enrolled:</span>
                    <span className="font-semibold text-slate-350">
                      {members.find((m) => m.id === selectedMemberId)?.subscriptions[0] ? '✓ ACTIVE SUBSCRIPTION' : '✗ NO ACTIVE PLAN'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <button
                onClick={handleScanTrigger}
                disabled={scanning || !selectedMemberId}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-4 px-4 rounded-xl text-xs uppercase tracking-widest transition shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>📷</span> {scanning ? 'Scanning biometric parameters...' : `Scan with ${method}`}
              </button>

              <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl text-[11px] text-slate-500 space-y-1">
                <p className="font-bold text-[9px] uppercase tracking-widest text-slate-400 mb-1">Hardware ESP32 Bridge logs</p>
                <p>⚡ listening on http://localhost:8080/relay/trigger</p>
                {relayStatus === 'OPEN' && <p className="text-emerald-400 font-medium">→ [COMMAND] Gate relay triggered: OPEN (3000ms duration)</p>}
                {relayStatus === 'CLOSED' && <p className="text-red-400 font-medium">→ [COMMAND] Gate relay triggered: CLOSE (Relocked)</p>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
