'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { fetchApi, getUser } from '@/lib/api';

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Create Form State
  const [newMember, setNewMember] = useState({ name: '', email: '', phone: '', planId: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState('');

  // Selected Member Details State
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [biometricsLoading, setBiometricsLoading] = useState(false);

  const loadData = async (query = '') => {
    setLoading(true);
    try {
      const data = await fetchApi(`members?search=${encodeURIComponent(query)}`);
      setMembers(data);
      
      const plansData = await fetchApi('plans');
      setPlans(plansData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getUser();
    if (!user || user.role === 'MEMBER') {
      router.push('/login');
      return;
    }
    loadData();
  }, [router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(search);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const created = await fetchApi('members', {
        method: 'POST',
        body: JSON.stringify(newMember),
      });
      if (created) {
        setMessage('Member successfully registered!');
        setNewMember({ name: '', email: '', phone: '', planId: '' });
        setShowAddModal(false);
        loadData();
      }
    } catch (err: any) {
      setMessage(`Registration failed: ${err.message}`);
    }
  };

  const handleSelectMember = async (id: string) => {
    try {
      const details = await fetchApi(`members/${id}`);
      setSelectedMember(details);
      setShowDetailsModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFreeze = async (id: string) => {
    try {
      const res = await fetchApi(`members/${id}/freeze`, { method: 'POST' });
      if (res) {
        // Refresh detail modal
        const details = await fetchApi(`members/${id}`);
        setSelectedMember(details);
        loadData(search);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnrolBiometrics = async (id: string, type: 'FACE' | 'FINGERPRINT') => {
    setBiometricsLoading(true);
    try {
      // Mock biometrics parameters
      const body = type === 'FACE' 
        ? {
            type: 'FACE',
            templateVector: Array.from({ length: 128 }, () => Math.random()), // mock face embedding vector
            faceThumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', // Mock professional avatar
          }
        : {
            type: 'FINGERPRINT',
            fingerprintIndex: Math.floor(Math.random() * 100) + 1, // mock scanner slot index
          };

      const res = await fetchApi(`members/${id}/biometrics`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (res) {
        // Refresh details
        const details = await fetchApi(`members/${id}`);
        setSelectedMember(details);
        alert(`${type} enrollment completed successfully!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBiometricsLoading(false);
    }
  };

  return (
    <div className="flex bg-slate-950 text-slate-100 min-h-screen">
      <Navigation />

      <main className="flex-1 p-5 md:p-8 overflow-y-auto relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Member Registry</h2>
            <p className="text-xs text-slate-400 mt-1">Enroll profiles, assign subscription plans, and manage biometric passes</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-2"
          >
            <span>➕</span> Register New Member
          </button>
        </div>

        {/* Search Header */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-900/40 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white transition"
          />
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold px-6 rounded-xl text-sm transition cursor-pointer"
          >
            Filter
          </button>
        </form>

        {/* Members Table */}
        <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 font-bold uppercase border-b border-slate-800">
                  <th className="p-4">Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Active Plan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      Querying member profiles...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      No members matching the criteria found.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => {
                    const activeSub = member.subscriptions[0];
                    return (
                      <tr key={member.id} className="hover:bg-slate-900/30 transition">
                        <td className="p-4 font-semibold text-slate-200">{member.name}</td>
                        <td className="p-4 text-slate-400">
                          <p>{member.email}</p>
                          <p className="text-[10px] text-slate-500">{member.phone || 'N/A'}</p>
                        </td>
                        <td className="p-4 text-slate-300">
                          {activeSub ? (
                            <div>
                              <p className="font-semibold">{activeSub.plan.name}</p>
                              <p className="text-[10px] text-slate-500">Expires: {new Date(activeSub.endDate).toLocaleDateString()}</p>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">No Active Plan</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            member.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                            member.status === 'FROZEN' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10' :
                            'bg-red-500/10 text-red-400 border border-red-500/10'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{new Date(member.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleSelectMember(member.id)}
                            className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold px-3.5 py-2 rounded-xl text-[11px] transition cursor-pointer"
                          >
                            Manage Account
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                ✕
              </button>
              
              <h3 className="text-xl font-extrabold mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Add Member Profile</h3>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="Arnold Schwarzenegger"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="arnold@gym.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    placeholder="+1 555-0199"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">Assign Membership Plan</label>
                  <select
                    value={newMember.planId}
                    onChange={(e) => setNewMember({ ...newMember, planId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-400 transition"
                  >
                    <option value="">No Subscription Plan (Inactive)</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ${parseFloat(p.price).toFixed(2)} ({p.durationDays} days)
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Create Member Account
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Member Details & Biometrics Management Modal */}
        {showDetailsModal && selectedMember && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto pr-2">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                ✕
              </button>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-800">
                <div className="w-16 h-16 rounded-full bg-slate-850 border border-slate-800 overflow-hidden flex items-center justify-center">
                  {selectedMember.biometrics?.find((b: any) => b.type === 'FACE')?.faceThumbnailUrl ? (
                    <img
                      src={selectedMember.biometrics.find((b: any) => b.type === 'FACE').faceThumbnailUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">👤</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-200">{selectedMember.name}</h3>
                  <p className="text-xs text-slate-400">{selectedMember.email}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">ID: {selectedMember.id}</p>
                </div>
                <div className="sm:ml-auto">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    selectedMember.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                    selectedMember.status === 'FROZEN' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10' :
                    'bg-red-500/10 text-red-400 border border-red-500/10'
                  }`}>
                    {selectedMember.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Membership Controls */}
                <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl">
                  <h4 className="font-extrabold text-sm text-slate-300 mb-4">Operations Control</h4>
                  
                  <div className="space-y-4">
                    <button
                      onClick={() => handleToggleFreeze(selectedMember.id)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold border transition duration-200 cursor-pointer ${
                        selectedMember.status === 'ACTIVE'
                          ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/10'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/10'
                      }`}
                    >
                      {selectedMember.status === 'ACTIVE' ? '🥶 Freeze Membership Account' : '🔥 Unfreeze / Activate Account'}
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm('Cancel this membership? The user will be unable to log check-ins.')) {
                          fetchApi(`members/${selectedMember.id}`, {
                            method: 'PUT',
                            body: JSON.stringify({ status: 'CANCELLED' })
                          }).then(() => handleSelectMember(selectedMember.id));
                        }
                      }}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 hover:border-red-500/20 py-2.5 px-4 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      🛑 Cancel Membership
                    </button>
                  </div>
                </div>

                {/* Biometrics Setup */}
                <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl">
                  <h4 className="font-extrabold text-sm text-slate-300 mb-4">Biometric Access Setup</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-850/60">
                      <span className="text-slate-400">Facial Recognition</span>
                      {selectedMember.biometrics?.some((b: any) => b.type === 'FACE') ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">✓ Enrolled</span>
                      ) : (
                        <button
                          disabled={biometricsLoading}
                          onClick={() => handleEnrolBiometrics(selectedMember.id, 'FACE')}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        >
                          Enrol Face
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Fingerprint Template</span>
                      {selectedMember.biometrics?.some((b: any) => b.type === 'FINGERPRINT') ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">✓ Enrolled</span>
                      ) : (
                        <button
                          disabled={biometricsLoading}
                          onClick={() => handleEnrolBiometrics(selectedMember.id, 'FINGERPRINT')}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        >
                          Enrol Scan
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscriptions History */}
              <div className="bg-slate-950/20 border border-slate-850 p-5 rounded-2xl">
                <h4 className="font-extrabold text-sm text-slate-300 mb-4">Billing & Subscriptions</h4>
                {selectedMember.subscriptions?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No subscription logs found for this member.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedMember.subscriptions.map((sub: any) => (
                      <div key={sub.id} className="border border-slate-850 p-4 rounded-xl text-xs bg-slate-900/20">
                        <div className="flex justify-between font-bold mb-2">
                          <span className="text-slate-200">{sub.plan.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            sub.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>{sub.status}</span>
                        </div>
                        <p className="text-slate-400">Validity: {new Date(sub.startDate).toLocaleDateString()} to {new Date(sub.endDate).toLocaleDateString()}</p>
                        
                        {/* Payments details */}
                        <div className="mt-3 pt-3 border-t border-slate-850/60">
                          <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mb-2">Invoice Receipts</p>
                          {sub.payments?.map((pay: any) => (
                            <div key={pay.id} className="flex justify-between items-center py-1">
                              <span className="text-slate-400">Invoice: ${parseFloat(pay.amount).toFixed(2)}</span>
                              <div className="flex items-center gap-3">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  pay.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' :
                                  pay.status === 'OVERDUE' ? 'bg-red-500/10 text-red-400 border border-red-500/10' :
                                  'bg-yellow-500/10 text-yellow-400'
                                }`}>{pay.status}</span>
                                {pay.status !== 'PAID' && (
                                  <button
                                    onClick={async () => {
                                      const res = await fetchApi(`plans/payments/${pay.id}/pay`, {
                                        method: 'POST',
                                        body: JSON.stringify({ paymentMethod: 'CASH' }),
                                      });
                                      if (res) {
                                        handleSelectMember(selectedMember.id);
                                        loadData(search);
                                      }
                                    }}
                                    className="bg-emerald-500 text-slate-950 font-bold px-2 py-1 rounded text-[9px] cursor-pointer"
                                  >
                                    Pay Cash
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
