import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Hospital, Plus, ClipboardList, Clock, CheckCircle, XCircle, X, Droplets,
  User, Phone, MapPin, Building2, BadgeCheck, Stethoscope, Edit3, Save, Link
} from 'lucide-react';

const ORGANS = ['Kidney', 'Liver', 'Heart', 'Lungs', 'Pancreas', 'Corneas', 'Skin', 'Bone Marrow'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_VALUES = ['low', 'medium', 'high', 'critical'];
const HOSPITAL_TYPES = ['government', 'private', 'trust', 'clinic'];

const statusBadge = {
  pending: 'badge-yellow',
  matched: 'badge-blue',
  fulfilled: 'badge-green',
  cancelled: 'badge-red',
};
const statusIcon = {
  pending: Clock,
  matched: CheckCircle,
  fulfilled: CheckCircle,
  cancelled: XCircle,
};
const urgencyColor = {
  low: 'bg-slate-600/40 text-slate-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400 animate-pulse',
};

function Tab({ id, label, icon: Icon, active, onClick }) {
  return (
    <button onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
        ${active ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/60'}`}>
      <Icon size={15} /> {label}
    </button>
  );
}

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [hospitalProfile, setHospitalProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const defaultForm = {
    organ_type: '', blood_group: '', patient_name: '', patient_age: '',
    patient_gender: '', patient_diagnosis: '', doctor_name: '', ward_number: '',
    urgency: 'medium', notes: ''
  };
  const [form, setForm] = useState(defaultForm);
  const [profileForm, setProfileForm] = useState({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reqRes, profRes] = await Promise.allSettled([
        api.get('/hospital/requests'),
        api.get('/hospital/profile'),
      ]);
      if (reqRes.status === 'fulfilled') setRequests(reqRes.value.data.requests || []);
      if (profRes.status === 'fulfilled') {
        const hosp = profRes.value.data.hospital;
        setHospitalProfile(hosp);
        setProfileForm({
          hospital_name: hosp.hospital_name || '',
          hospital_type: hosp.hospital_type || 'private',
          address: hosp.address || '',
          city: hosp.city || '',
          state: hosp.state || '',
          pincode: hosp.pincode || '',
          contact_number: hosp.contact_number || '',
          email: hosp.email || '',
          website: hosp.website || '',
          license_number: hosp.license_number || '',
          bed_count: hosp.bed_count || '',
          specialization: hosp.specialization || '',
        });
      }
    } catch {
      toast.error('Could not load data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const { data } = await api.get('/hospital/matches');
      setMatches(data.matches || []);
    } catch {
      toast.error('Could not load matches.');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'matches' && matches.length === 0) fetchMatches();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/hospital/request', form);
      toast.success('Organ request submitted!');
      setShowModal(false);
      setForm(defaultForm);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      await api.put('/hospital/profile', profileForm);
      toast.success('Hospital profile updated!');
      setEditingProfile(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setSavingProfile(false);
    }
  };

  const counts = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    matched: requests.filter(r => r.status === 'matched' || r.status === 'fulfilled').length,
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Hospital Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome, <span className="text-brand-400 font-medium">{user?.name}</span>
            {hospitalProfile?.is_verified && <span className="ml-2 badge-green text-[10px]"><BadgeCheck size={10} /> Verified</span>}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Organ Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: ClipboardList, label: 'Total Requests',    value: counts.total,     color: 'bg-blue-600' },
          { icon: Clock,         label: 'Pending',           value: counts.pending,   color: 'bg-amber-600' },
          { icon: CheckCircle,   label: 'Matched/Fulfilled', value: counts.matched,   color: 'bg-emerald-600' },
          { icon: XCircle,       label: 'Cancelled',         value: counts.cancelled, color: 'bg-red-600' },
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
        <Tab id="requests" label="Organ Requests"   icon={ClipboardList} active={activeTab === 'requests'} onClick={handleTabChange} />
        <Tab id="matches"  label="Matched Donors"   icon={CheckCircle}   active={activeTab === 'matches'}  onClick={handleTabChange} />
        <Tab id="profile"  label="Hospital Profile" icon={Building2}     active={activeTab === 'profile'}  onClick={handleTabChange} />
      </div>

      {/* ── REQUESTS TAB ── */}
      {activeTab === 'requests' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Organ Requests</h2>
            <span className="text-slate-400 text-sm">{requests.length} total</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Hospital size={32} className="text-brand-400 animate-pulse" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No requests yet. Click "New Organ Request" to begin.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Patient', 'Age/Gender', 'Diagnosis', 'Organ', 'Blood', 'Doctor', 'Ward', 'Urgency', 'Status', 'Date'].map(h => (
                      <th key={h} className="table-header text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => {
                    const Icon = statusIcon[req.status] || Clock;
                    return (
                      <tr key={req.request_id} className="table-row">
                        <td className="table-cell font-medium text-white">{req.patient_name}</td>
                        <td className="table-cell text-xs text-slate-400">
                          {req.patient_age && <span>{req.patient_age} yrs</span>}
                          {req.patient_gender && <span className="ml-1 capitalize">/ {req.patient_gender}</span>}
                        </td>
                        <td className="table-cell text-xs max-w-[140px] truncate" title={req.patient_diagnosis}>{req.patient_diagnosis || '—'}</td>
                        <td className="table-cell capitalize">{req.organ_type}</td>
                        <td className="table-cell">
                          <span className="flex items-center gap-1"><Droplets size={12} className="text-rose-400" />{req.blood_group}</span>
                        </td>
                        <td className="table-cell text-xs text-slate-400">{req.doctor_name || '—'}</td>
                        <td className="table-cell text-xs text-slate-400">{req.ward_number || '—'}</td>
                        <td className="table-cell">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${urgencyColor[req.urgency]}`}>{req.urgency}</span>
                        </td>
                        <td className="table-cell">
                          <span className={statusBadge[req.status] || 'badge-yellow'}><Icon size={10} />{req.status}</span>
                        </td>
                        <td className="table-cell text-slate-400 whitespace-nowrap">{new Date(req.requested_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
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
            <h2 className="text-lg font-semibold text-white">Matched Donors</h2>
            <span className="text-slate-400 text-sm">{matches.length} matches</span>
          </div>
          {matches.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No matches found yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Donor Name', 'Age/Gender', 'Blood Group', 'Organs Available', 'Patient', 'Organ Needed', 'Urgency', 'Matched On'].map(h => (
                      <th key={h} className="table-header text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matches.map(m => (
                    <tr key={m.match_id} className="table-row">
                      <td className="table-cell font-medium text-white">{m.donor_name}</td>
                      <td className="table-cell text-xs text-slate-400">{m.donor_age} yrs / {m.donor_gender}</td>
                      <td className="table-cell">
                        <span className="flex items-center gap-1"><Droplets size={12} className="text-rose-400" />{m.donor_blood_group}</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(m.donor_organs || []).map(o => <span key={o} className="badge-blue text-[10px]">{o}</span>)}
                        </div>
                      </td>
                      <td className="table-cell text-slate-300">{m.patient_name}</td>
                      <td className="table-cell capitalize">{m.organ_type}</td>
                      <td className="table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${urgencyColor[m.urgency]}`}>{m.urgency}</span>
                      </td>
                      <td className="table-cell text-slate-400 whitespace-nowrap">{new Date(m.matched_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Building2 size={18} className="text-brand-400" /> Hospital Information</h2>
            {!editingProfile ? (
              <button onClick={() => setEditingProfile(true)} className="btn-secondary flex items-center gap-2 text-sm py-2"><Edit3 size={14} /> Edit</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditingProfile(false)} className="btn-secondary flex items-center gap-2 text-sm py-2"><X size={14} /> Cancel</button>
                <button onClick={handleProfileSave} disabled={savingProfile} className="btn-primary flex items-center gap-2 text-sm py-2"><Save size={14} /> {savingProfile ? 'Saving…' : 'Save'}</button>
              </div>
            )}
          </div>

          {hospitalProfile ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {editingProfile ? (
                <>
                  <div>
                    <label className="label">Hospital Name</label>
                    <input className="input-field" value={profileForm.hospital_name} onChange={e => setProfileForm(f => ({ ...f, hospital_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Hospital Type</label>
                    <select className="input-field" value={profileForm.hospital_type} onChange={e => setProfileForm(f => ({ ...f, hospital_type: e.target.value }))}>
                      {HOSPITAL_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Address</label>
                    <textarea className="input-field resize-none" rows={2} value={profileForm.address} onChange={e => setProfileForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">City</label>
                    <input className="input-field" value={profileForm.city} onChange={e => setProfileForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">State</label>
                    <input className="input-field" value={profileForm.state} onChange={e => setProfileForm(f => ({ ...f, state: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Contact Number</label>
                    <input className="input-field" value={profileForm.contact_number} onChange={e => setProfileForm(f => ({ ...f, contact_number: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">License Number</label>
                    <input className="input-field" value={profileForm.license_number} onChange={e => setProfileForm(f => ({ ...f, license_number: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Total Beds</label>
                    <input type="number" className="input-field" value={profileForm.bed_count} onChange={e => setProfileForm(f => ({ ...f, bed_count: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Website</label>
                    <input className="input-field" placeholder="https://" value={profileForm.website} onChange={e => setProfileForm(f => ({ ...f, website: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Specialization</label>
                    <input className="input-field" placeholder="e.g. Organ Transplant, Nephrology, Cardiac" value={profileForm.specialization} onChange={e => setProfileForm(f => ({ ...f, specialization: e.target.value }))} />
                  </div>
                </>
              ) : (
                <>
                  <div className="sm:col-span-2 flex items-start gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-700/40">
                    <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shrink-0">
                      <Building2 size={24} className="text-brand-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{hospitalProfile.hospital_name}</h3>
                      <p className="text-slate-400 text-sm capitalize">{hospitalProfile.hospital_type} Hospital</p>
                      <div className="flex gap-2 mt-1">
                        {hospitalProfile.is_verified
                          ? <span className="badge-green text-[10px]"><BadgeCheck size={10}/> Verified by Admin</span>
                          : <span className="badge-yellow text-[10px]"><Clock size={10}/> Verification Pending</span>
                        }
                      </div>
                    </div>
                  </div>
                  {[
                    { icon: MapPin,       label: 'Address',         value: `${hospitalProfile.address}${hospitalProfile.city ? ', ' + hospitalProfile.city : ''}${hospitalProfile.state ? ', ' + hospitalProfile.state : ''}` },
                    { icon: Phone,        label: 'Contact',         value: hospitalProfile.contact_number },
                    { icon: Stethoscope, label: 'License No.',      value: hospitalProfile.license_number || '—' },
                    { icon: Building2,   label: 'Bed Capacity',     value: hospitalProfile.bed_count ? `${hospitalProfile.bed_count} beds` : '—' },
                    { icon: Stethoscope, label: 'Specialization',   value: hospitalProfile.specialization || '—' },
                    { icon: Link,        label: 'Website',          value: hospitalProfile.website || '—' },
                  ].map(({ icon: I, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
                        <I size={14} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
                        <p className="text-slate-200 text-sm mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Hospital profile not set up. Please register first.</p>
          )}
        </div>
      )}

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="card w-full max-w-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Submit Organ Request</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Patient Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Patient Full Name</label>
                  <input className="input-field" placeholder="Patient full name" value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Patient Age</label>
                  <input type="number" className="input-field" placeholder="Age in years" value={form.patient_age} onChange={e => setForm(f => ({ ...f, patient_age: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Patient Gender</label>
                  <select className="input-field" value={form.patient_gender} onChange={e => setForm(f => ({ ...f, patient_gender: e.target.value }))}>
                    <option value="">Select</option>
                    {['male','female','other'].map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase()+g.slice(1)}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Diagnosis / Medical Condition</label>
                  <input className="input-field" placeholder="e.g. End-stage renal disease, Dilated cardiomyopathy" value={form.patient_diagnosis} onChange={e => setForm(f => ({ ...f, patient_diagnosis: e.target.value }))} />
                </div>
              </div>

              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold pt-2">Request Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Organ Required</label>
                  <select className="input-field" value={form.organ_type} onChange={e => setForm(f => ({ ...f, organ_type: e.target.value }))} required>
                    <option value="">Select organ</option>
                    {ORGANS.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Blood Group</label>
                  <select className="input-field" value={form.blood_group} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))} required>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Urgency Level</label>
                  <select className="input-field" value={form.urgency} onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}>
                    {URGENCY_VALUES.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase()+u.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Doctor Name</label>
                  <input className="input-field" placeholder="Attending physician" value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Ward / Room Number</label>
                  <input className="input-field" placeholder="e.g. ICU-3, W-204" value={form.ward_number} onChange={e => setForm(f => ({ ...f, ward_number: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Additional Notes</label>
                <textarea className="input-field resize-none" rows={3} placeholder="Any special requirements or clinical notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? 'Submitting…' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
