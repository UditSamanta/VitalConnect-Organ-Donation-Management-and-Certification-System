import { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Users, ClipboardList, CheckCircle, XCircle, BarChart3, Search,
  Clock, Droplets, Building2, BadgeCheck, Heart, Link2
} from 'lucide-react';

function Tab({ id, label, icon: Icon, active, onClick, badge }) {
  return (
    <button onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
        ${active ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/60'}`}>
      <Icon size={15} /> {label}
      {badge !== undefined && badge > 0 && (
        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-white/20' : 'bg-amber-500/30 text-amber-300'}`}>{badge}</span>
      )}
    </button>
  );
}

const statusBadge = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red', matched: 'badge-blue', fulfilled: 'badge-green', cancelled: 'badge-red' };
const urgencyColor = {
  low:      'bg-slate-600/40 text-slate-400',
  medium:   'bg-blue-500/20 text-blue-400',
  high:     'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('donors');
  const [donors, setDonors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [donorsRes, statsRes] = await Promise.all([
        api.get('/admin/donors'),
        api.get('/admin/stats'),
      ]);
      setDonors(donorsRes.data.donors || []);
      setStats(statsRes.data.stats || {});
    } catch {
      toast.error('Could not load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      const { data } = await api.get('/admin/hospitals');
      setHospitals(data.hospitals || []);
    } catch { toast.error('Could not load hospitals.'); }
  };

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/admin/requests');
      setRequests(data.requests || []);
    } catch { toast.error('Could not load requests.'); }
  };

  const fetchMatches = async () => {
    try {
      const { data } = await api.get('/admin/matches');
      setMatches(data.matches || []);
    } catch { toast.error('Could not load matches.'); }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearch('');
    if (tab === 'hospitals' && hospitals.length === 0)  fetchHospitals();
    if (tab === 'requests' && requests.length === 0)   fetchRequests();
    if (tab === 'matches'  && matches.length === 0)    fetchMatches();
  };

  const approveOrReject = async (donorId, status) => {
    try {
      await api.put(`/admin/approve-donor/${donorId}`, { status });
      toast.success(`Donor ${status}.`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const verifyHospital = async (hospitalId, is_verified) => {
    try {
      await api.put(`/admin/verify-hospital/${hospitalId}`, { is_verified });
      toast.success(is_verified ? 'Hospital verified!' : 'Hospital unverified.');
      fetchHospitals();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const filteredDonors = donors.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredHospitals = hospitals.filter(h =>
    h.hospital_name?.toLowerCase().includes(search.toLowerCase()) ||
    h.city?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredRequests = requests.filter(r =>
    r.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.hospital_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.organ_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">Manage donors, hospitals, organ requests and system analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Users,         label: 'Total Donors',    value: stats?.total_donors ?? '…',       color: 'bg-blue-600' },
          { icon: CheckCircle,   label: 'Approved',         value: stats?.approved_donors ?? '…',    color: 'bg-emerald-600' },
          { icon: Clock,         label: 'Pending Donors',   value: stats?.pending_donors ?? '…',     color: 'bg-amber-600' },
          { icon: ClipboardList, label: 'Organ Requests',   value: stats?.total_requests ?? '…',     color: 'bg-violet-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-slate-400 text-sm">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-800/80 rounded-xl border border-slate-700">
        <Tab id="donors"    label="Donors"         icon={Users}         active={activeTab === 'donors'}    onClick={handleTabChange} badge={stats?.pending_donors} />
        <Tab id="hospitals" label="Hospitals"      icon={Building2}     active={activeTab === 'hospitals'} onClick={handleTabChange} />
        <Tab id="requests"  label="Organ Requests" icon={ClipboardList} active={activeTab === 'requests'}  onClick={handleTabChange} badge={stats?.pending_requests} />
        <Tab id="matches"   label="Matches"        icon={Link2}         active={activeTab === 'matches'}   onClick={handleTabChange} />
        <Tab id="analytics" label="Analytics"      icon={BarChart3}     active={activeTab === 'analytics'} onClick={handleTabChange} />
      </div>

      {/* Search bar for table tabs */}
      {['donors','hospitals','requests'].includes(activeTab) && (
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-9 py-2 text-sm" placeholder={`Search ${activeTab}…`}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {/* ── DONORS TAB ── */}
      {activeTab === 'donors' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Donor Management</h2>
            <span className="text-slate-400 text-sm">{filteredDonors.length} donors</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Users size={32} className="text-brand-400 animate-pulse" /></div>
          ) : filteredDonors.length === 0 ? (
            <div className="text-center py-16 text-slate-400">No donors found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>{['Name','Email','Blood','Age/Gender','City','Organs','Conditions','Status','Certificate','Actions'].map(h => (
                    <th key={h} className="table-header text-left">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filteredDonors.map(donor => (
                    <tr key={donor.donor_id} className="table-row">
                      <td className="table-cell font-medium text-white">{donor.name}</td>
                      <td className="table-cell text-slate-400 text-xs">{donor.email}</td>
                      <td className="table-cell">
                        <span className="flex items-center gap-1"><Droplets size={12} className="text-rose-400" />{donor.blood_group}</span>
                      </td>
                      <td className="table-cell text-xs text-slate-400">{donor.age} yrs / {donor.gender}</td>
                      <td className="table-cell text-xs text-slate-400">{donor.city || '—'}</td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(donor.organs || []).slice(0, 2).map(o => <span key={o} className="badge-blue text-[10px]">{o}</span>)}
                          {(donor.organs || []).length > 2 && <span className="text-slate-500 text-xs">+{donor.organs.length - 2}</span>}
                        </div>
                      </td>
                      <td className="table-cell">
                        {donor.condition_count > 0
                          ? <span className="badge-yellow text-[10px]">{donor.condition_count} condition{donor.condition_count > 1 ? 's' : ''}</span>
                          : <span className="text-slate-600 text-xs">None</span>}
                      </td>
                      <td className="table-cell"><span className={statusBadge[donor.status] || 'badge-yellow'}>{donor.status}</span></td>
                      <td className="table-cell text-xs font-mono text-slate-400">{donor.certificate_uid || '—'}</td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          {donor.status !== 'approved' && (
                            <button onClick={() => approveOrReject(donor.donor_id, 'approved')}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all">
                              <CheckCircle size={11} /> Approve
                            </button>
                          )}
                          {donor.status !== 'rejected' && (
                            <button onClick={() => approveOrReject(donor.donor_id, 'rejected')}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 transition-all">
                              <XCircle size={11} /> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── HOSPITALS TAB ── */}
      {activeTab === 'hospitals' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Hospital Management</h2>
            <span className="text-slate-400 text-sm">{filteredHospitals.length} hospitals</span>
          </div>
          {filteredHospitals.length === 0 ? (
            <div className="text-center py-16 text-slate-400">No hospitals found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>{['Hospital','Type','City','License No.','Contact','Beds','Specialization','Requests','Status','Actions'].map(h => (
                    <th key={h} className="table-header text-left">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filteredHospitals.map(h => (
                    <tr key={h.hospital_id} className="table-row">
                      <td className="table-cell font-medium text-white">
                        <div>{h.hospital_name}</div>
                        <div className="text-slate-500 text-xs">{h.user_email}</div>
                      </td>
                      <td className="table-cell capitalize text-slate-400 text-xs">{h.hospital_type}</td>
                      <td className="table-cell text-slate-400 text-xs">{h.city || '—'}</td>
                      <td className="table-cell font-mono text-xs text-slate-400">{h.license_number || '—'}</td>
                      <td className="table-cell text-xs text-slate-400">{h.contact_number}</td>
                      <td className="table-cell text-xs text-slate-400">{h.bed_count || '—'}</td>
                      <td className="table-cell text-xs text-slate-400 max-w-[160px] truncate" title={h.specialization}>{h.specialization || '—'}</td>
                      <td className="table-cell text-center">{h.total_requests}</td>
                      <td className="table-cell">
                        {h.is_verified
                          ? <span className="badge-green text-[10px]"><BadgeCheck size={10} /> Verified</span>
                          : <span className="badge-yellow text-[10px]"><Clock size={10} /> Pending</span>}
                      </td>
                      <td className="table-cell">
                        {h.is_verified ? (
                          <button onClick={() => verifyHospital(h.hospital_id, false)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 transition-all">
                            <XCircle size={11} /> Unverify
                          </button>
                        ) : (
                          <button onClick={() => verifyHospital(h.hospital_id, true)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all">
                            <BadgeCheck size={11} /> Verify
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ORGAN REQUESTS TAB ── */}
      {activeTab === 'requests' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">All Organ Requests</h2>
            <span className="text-slate-400 text-sm">{filteredRequests.length} requests</span>
          </div>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-16 text-slate-400">No requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>{['Hospital','Patient','Age/Gender','Diagnosis','Organ','Blood','Doctor','Ward','Urgency','Status','Date'].map(h => (
                    <th key={h} className="table-header text-left">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filteredRequests.map(r => (
                    <tr key={r.request_id} className="table-row">
                      <td className="table-cell text-xs">
                        <div className="text-slate-300 font-medium">{r.hospital_name}</div>
                        <div className="text-slate-500">{r.hospital_city}</div>
                      </td>
                      <td className="table-cell font-medium text-white">{r.patient_name}</td>
                      <td className="table-cell text-xs text-slate-400">{r.patient_age ? `${r.patient_age} yrs` : '—'}{r.patient_gender ? ` / ${r.patient_gender}` : ''}</td>
                      <td className="table-cell text-xs text-slate-400 max-w-[140px] truncate" title={r.patient_diagnosis}>{r.patient_diagnosis || '—'}</td>
                      <td className="table-cell capitalize">{r.organ_type}</td>
                      <td className="table-cell"><span className="flex items-center gap-1"><Droplets size={12} className="text-rose-400" />{r.blood_group}</span></td>
                      <td className="table-cell text-xs text-slate-400">{r.doctor_name || '—'}</td>
                      <td className="table-cell text-xs text-slate-400">{r.ward_number || '—'}</td>
                      <td className="table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${urgencyColor[r.urgency]}`}>{r.urgency}</span>
                      </td>
                      <td className="table-cell"><span className={statusBadge[r.status] || 'badge-yellow'}>{r.status}</span></td>
                      <td className="table-cell text-slate-400 text-xs whitespace-nowrap">{new Date(r.requested_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MATCHES TAB ── */}
      {activeTab === 'matches' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">All Donor ↔ Patient Matches</h2>
            <span className="text-slate-400 text-sm">{matches.length} matches</span>
          </div>
          {matches.length === 0 ? (
            <div className="text-center py-16 text-slate-400">No matches found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>{['Donor','Age','Blood Group','Organ','Patient','Urgency','Hospital','Matched On'].map(h => (
                    <th key={h} className="table-header text-left">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {matches.map(m => (
                    <tr key={m.match_id} className="table-row">
                      <td className="table-cell font-medium text-white">{m.donor_name}</td>
                      <td className="table-cell text-slate-400 text-xs">{m.donor_age} yrs</td>
                      <td className="table-cell"><span className="flex items-center gap-1"><Droplets size={12} className="text-rose-400" />{m.blood_group}</span></td>
                      <td className="table-cell capitalize">{m.organ_type}</td>
                      <td className="table-cell text-slate-300">{m.patient_name}</td>
                      <td className="table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${urgencyColor[m.urgency]}`}>{m.urgency}</span>
                      </td>
                      <td className="table-cell text-slate-400 text-xs">{m.hospital_name}</td>
                      <td className="table-cell text-slate-400 text-xs whitespace-nowrap">{new Date(m.matched_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Donor status breakdown */}
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2"><Users size={16} className="text-brand-400" /> Donor Status Breakdown</h3>
            <div className="space-y-4">
              {[
                { label: 'Approved', value: stats?.approved_donors || 0, total: stats?.total_donors || 1, color: 'bg-emerald-500' },
                { label: 'Pending',  value: stats?.pending_donors  || 0, total: stats?.total_donors || 1, color: 'bg-amber-500' },
                { label: 'Rejected', value: Math.max(0, (stats?.total_donors || 0) - (stats?.approved_donors || 0) - (stats?.pending_donors || 0)), total: stats?.total_donors || 1, color: 'bg-red-500' },
              ].map(({ label, value, total, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-300">{label}</span>
                    <span className="text-slate-400 font-medium">{value} <span className="text-slate-600">/ {total}</span></span>
                  </div>
                  <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-700`}
                      style={{ width: `${total ? Math.round((value / total) * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Organ-wise pledge distribution */}
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2"><Heart size={16} className="text-rose-400" /> Organ Pledge Distribution</h3>
            <div className="space-y-3">
              {(stats?.organ_breakdown || []).map(({ organ_name, count }) => {
                const maxC = Math.max(...(stats?.organ_breakdown || [{ count: 1 }]).map(o => o.count));
                return (
                  <div key={organ_name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{organ_name}</span>
                      <span className="text-slate-400 font-medium">{count} donors</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.round((count / maxC) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
              {(!stats?.organ_breakdown || stats.organ_breakdown.length === 0) && (
                <p className="text-slate-500 text-sm">No organ data yet.</p>
              )}
            </div>
          </div>

          {/* Urgency breakdown */}
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2"><ClipboardList size={16} className="text-violet-400" /> Request Urgency Breakdown</h3>
            <div className="space-y-3">
              {(stats?.urgency_breakdown || []).map(({ urgency, count }) => (
                <div key={urgency} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${urgencyColor[urgency]}`}>{urgency}</span>
                  <span className="text-white font-semibold">{count} request{count > 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System overview */}
          <div className="card">
            <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2"><BarChart3 size={16} className="text-blue-400" /> System Overview</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Donors',        value: stats?.total_donors },
                { label: 'Approved Donors',      value: stats?.approved_donors },
                { label: 'Pending Reviews',      value: stats?.pending_donors },
                { label: 'Total Hospitals',      value: stats?.total_hospitals },
                { label: 'Verified Hospitals',   value: stats?.verified_hospitals },
                { label: 'Organ Requests',       value: stats?.total_requests },
                { label: 'Pending Requests',     value: stats?.pending_requests },
                { label: 'Successful Matches',   value: stats?.total_matches },
                { label: 'Certificates Issued',  value: stats?.total_certificates },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-slate-700/50 last:border-0">
                  <span className="text-slate-400 text-sm">{label}</span>
                  <span className="text-white font-semibold">{value ?? '…'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
