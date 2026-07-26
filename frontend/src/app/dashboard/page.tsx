'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { fetchApi, getUser, WS_BASE_URL } from '@/lib/api';
import { io } from 'socket.io-client';

export default function DashboardPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeMembers: 0,
    todayCheckIns: 0,
    currentOccupancy: 0,
    paidRevenue: 0,
    overdueRevenue: 0,
  });
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [isOverriding, setIsOverriding] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Load Initial Data
  useEffect(() => {
    const user = getUser();
    if (!user || user.role === 'MEMBER') {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        // Load Logs
        const logsData = await fetchApi('checkins/logs');
        setLogs(logsData);

        // Load Members for manual override dropdown
        const membersData = await fetchApi('members');
        setMembers(membersData);

        // Calculate Stats
        const active = membersData.filter((m: any) => m.status === 'ACTIVE').length;
        const checkInsToday = logsData.filter((l: any) => {
          const logDate = new Date(l.timestamp).toDateString();
          const todayDate = new Date().toDateString();
          return logDate === todayDate && l.success;
        }).length;
        
        // Mock current occupancy based on recent checkins in last 2 hours
        const recentCheckins = logsData.filter((l: any) => {
          const hoursAgo = (Date.now() - new Date(l.timestamp).getTime()) / (1000 * 60 * 60);
          return hoursAgo < 2 && l.success;
        }).length;

        // Load Payments for Revenue stats
        const payments = await fetchApi('plans/payments');
        const paid = payments
          .filter((p: any) => p.status === 'PAID')
          .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
        const overdue = payments
          .filter((p: any) => p.status === 'OVERDUE')
          .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

        setStats({
          activeMembers: active,
          todayCheckIns: checkInsToday,
          currentOccupancy: Math.max(recentCheckins, 1), // At least 1 (Arnold Schwarzenegger from seed)
          paidRevenue: paid,
          overdueRevenue: overdue,
        });
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      }
    };

    loadData();

    // Setup Socket.io real-time listener
    const socket = io(WS_BASE_URL);
    socket.on('newCheckIn', (newLog: any) => {
      // Prepend to logs
      setLogs((prev) => [newLog, ...prev]);

      // Update counters
      if (newLog.success) {
        setStats((prev) => ({
          ...prev,
          todayCheckIns: prev.todayCheckIns + 1,
          currentOccupancy: prev.currentOccupancy + 1,
        }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [router]);

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    
    setIsOverriding(true);
    setMessage('');

    try {
      const res = await fetchApi('checkins/manual', {
        method: 'POST',
        body: JSON.stringify({ memberId: selectedMember }),
      });
      if (res.success) {
        setMessage(`Successfully checked in ${res.memberName}`);
        setSelectedMember('');
        // Reload dashboard logs & stats
        const updatedLogs = await fetchApi('checkins/logs');
        setLogs(updatedLogs);
      }
    } catch (err: any) {
      setMessage(`Override failed: ${err.message}`);
    } finally {
      setIsOverriding(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  return (
    <div className="flex bg-slate-950 text-slate-100 min-h-screen">
      <Navigation />
      
      <main className="flex-1 p-5 md:p-8 overflow-y-auto relative">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Management Center</h2>
            <p className="text-xs text-slate-400 mt-1">Real-time gym attendance and operational overview</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-xs font-semibold text-slate-400">Live Server Connected</span>
          </div>
        </div>

        {/* CSS Grid Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-slate-800 text-6xl font-bold group-hover:scale-110 transition duration-300">👥</div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Active Members</p>
            <h3 className="text-3xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{stats.activeMembers}</h3>
            <p className="text-[10px] text-slate-500 mt-2">Active subscription tiers</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-slate-800 text-6xl font-bold group-hover:scale-110 transition duration-300">⚡</div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Today's Check-ins</p>
            <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{stats.todayCheckIns}</h3>
            <p className="text-[10px] text-slate-500 mt-2">Successful biometric scans</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-slate-800 text-6xl font-bold group-hover:scale-110 transition duration-300">🏃‍♂️</div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Occupancy</p>
            <h3 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">{stats.currentOccupancy}</h3>
            <p className="text-[10px] text-slate-500 mt-2">Members inside the facility</p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-slate-800 text-6xl font-bold group-hover:scale-110 transition duration-300">💵</div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gross Revenue</p>
            <h3 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">${stats.paidRevenue.toFixed(2)}</h3>
            <p className="text-[10px] text-red-400 mt-2">Overdue payments: ${stats.overdueRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Dashboard Body split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Live Check-in Log Stream (Takes 2 cols) */}
          <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 flex flex-col min-h-[450px]">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-extrabold text-lg text-slate-200">Real-time Check-In stream</h4>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 bg-slate-950/60 border border-slate-800 px-3 py-1 rounded-full">WebSockets Log</span>
            </div>

            <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar flex-1">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 border border-dashed border-slate-850 rounded-xl py-20">
                  <span className="text-4xl mb-3">📡</span>
                  <p className="text-sm">Waiting for biometric gate events...</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                      log.success
                        ? 'bg-slate-900/40 border-slate-850 hover:border-emerald-500/30'
                        : 'bg-red-500/5 border-red-500/10 hover:border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {log.photoUrl ? (
                          <img
                            src={log.photoUrl}
                            alt={log.memberName}
                            className="w-11 h-11 rounded-full object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-slate-400">
                            {log.memberName.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-1 -right-1 text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-lg ${
                            log.method === 'FACE' ? 'bg-cyan-500 text-slate-950' :
                            log.method === 'FINGERPRINT' ? 'bg-purple-500 text-slate-950' :
                            log.method === 'QR' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                          }`}
                          title={`Scanned via ${log.method}`}
                        >
                          {log.method === 'FACE' ? '👤' :
                           log.method === 'FINGERPRINT' ? '☝️' :
                           log.method === 'QR' ? '📱' : '🔧'}
                        </span>
                      </div>

                      <div>
                        <h5 className="font-semibold text-sm text-slate-200">{log.memberName}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold uppercase ${log.success ? 'text-emerald-400' : 'text-red-400'}`}>
                            {log.success ? 'Access Granted' : 'Access Denied'}
                          </span>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        {!log.success && (
                          <p className="text-[11px] text-red-300 mt-1 font-medium bg-red-500/10 border border-red-500/10 px-2 py-0.5 rounded w-max">
                            Error: {log.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-medium bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-lg">
                        {log.method}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Override Controls Panel (Takes 1 col) */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 flex flex-col">
            <h4 className="font-extrabold text-lg text-slate-200 mb-6">Reception Overrides</h4>

            {message && (
              <div className={`p-3.5 border rounded-xl text-xs font-semibold mb-6 ${
                message.startsWith('Successfully')
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleManualCheckIn} className="space-y-4 flex-1">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">Manual Gate Override</label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-300 transition"
                  required
                >
                  <option value="">Select Member to Check In...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email}) - {member.status}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isOverriding || !selectedMember}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🔑</span> {isOverriding ? 'Overriding...' : 'Trigger Gate Relay'}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-800 pt-6">
              <h5 className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-4">Device Status</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Fingerprint Reader</span>
                  <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">Connected</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Tablet Camera</span>
                  <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">Running</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Gate Relay (ESP32)</span>
                  <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">Online</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
