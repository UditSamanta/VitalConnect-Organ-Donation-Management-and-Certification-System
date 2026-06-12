import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Heart, Droplets, Calendar, CheckCircle, Clock, Award, Phone, MapPin,
  Edit3, Save, X, Activity, Shield, Pill, Stethoscope, User, AlertTriangle,
  Salad, Wind, Dumbbell, FileText, UserCheck
} from 'lucide-react';

const ORGANS = ['Kidney', 'Liver', 'Heart', 'Lungs', 'Pancreas', 'Corneas', 'Skin', 'Bone Marrow'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CONDITIONS_LIST = [
  'Hypertension','Type 2 Diabetes','Type 1 Diabetes','Asthma','Heart Disease',
  'Kidney Disease','Liver Disease','Thyroid Disorder','HIV/AIDS','Hepatitis B',
  'Hepatitis C','Cancer','Epilepsy','Tuberculosis','Arthritis'
];

function Tab({ id, label, icon: Icon, active, onClick }) {
  return (
    <button onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
        ${active ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/60'}`}>
      <Icon size={15} /> {label}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-slate-400 text-sm">{label}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        {typeof value === 'string' || typeof value === 'number'
          ? <p className="text-slate-200 text-sm mt-0.5">{value}</p>
          : <div className="mt-1">{value}</div>
        }
      </div>
    </div>
  );
}

export default function DonorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [editingMedical, setEditingMedical] = useState(false);
  const [form, setForm] = useState({});
  const [medForm, setMedForm] = useState({ conditions: [], allergies: [], lifestyle: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/donor/profile');
      const donor = data.donor;
      setProfile(donor);
      setForm({
        address: donor?.address || '',
        city: donor?.city || '',
        state: donor?.state || '',
        pincode: donor?.pincode || '',
        contact_number: donor?.contact_number || '',
        organs: donor?.organs || [],
        age: donor?.age || '',
        gender: donor?.gender || '',
        blood_group: donor?.blood_group || '',
        emergency_contact_name: donor?.emergency_contact_name || '',
        emergency_contact_phone: donor?.emergency_contact_phone || '',
        emergency_contact_relation: donor?.emergency_contact_relation || '',
      });
      setMedForm({
        conditions: donor?.medical_conditions || [],
        allergies: donor?.allergies || [],
        lifestyle: donor?.lifestyle || {
          bmi: '', smoker: false, alcohol_use: 'none',
          exercise_freq: 'none', diet_type: 'non-vegetarian',
          past_surgeries: '', current_medications: ''
        },
      });
    } catch {
      toast.error('Could not load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/donor/update', form);
      toast.success('Profile updated!');
      setEditing(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally { setSaving(false); }
  };

  const handleMedicalSave = async () => {
    setSaving(true);
    try {
      await api.put('/donor/medical', medForm);
      toast.success('Medical history updated!');
      setEditingMedical(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally { setSaving(false); }
  };

  const toggleOrgan = (organ) => {
    setForm(f => ({
      ...f,
      organs: f.organs.includes(organ)
        ? f.organs.filter(o => o !== organ)
        : [...f.organs, organ],
    }));
  };

  const toggleCondition = (name) => {
    setMedForm(f => {
      const exists = f.conditions.find(c => c.condition_name === name);
      if (exists) {
        return { ...f, conditions: f.conditions.filter(c => c.condition_name !== name) };
      }
      return { ...f, conditions: [...f.conditions, { condition_name: name, severity: 'mild', is_current: true, notes: '' }] };
    });
  };

  const addAllergy = () => {
    setMedForm(f => ({ ...f, allergies: [...f.allergies, { allergen: '', reaction_type: '' }] }));
  };

  const updateAllergy = (idx, field, value) => {
    setMedForm(f => {
      const updated = [...f.allergies];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...f, allergies: updated };
    });
  };

  const removeAllergy = (idx) => {
    setMedForm(f => ({ ...f, allergies: f.allergies.filter((_, i) => i !== idx) }));
  };

  const statusColor = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Heart size={40} className="text-brand-400 animate-pulse mx-auto mb-4" />
        <p className="text-slate-400">Loading your profile…</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <Heart size={48} className="text-slate-600 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">No donor profile found</h2>
      <p className="text-slate-400 text-sm">Your donor profile may still be setting up. Try refreshing.</p>
    </div>
  );

  const donorOrgans = profile?.organs || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Donor Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back, <span className="text-brand-400 font-medium">{user?.name}</span></p>
        </div>
        {profile?.status === 'approved' && profile?.certificate_uid && (
          <a href={`/certificate/${profile.donor_id}`} className="btn-success flex items-center gap-2">
            <Award size={16} /> Download Certificate
          </a>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Heart} label="Organs Pledged" value={donorOrgans.length} color="bg-rose-600" />
        <StatCard icon={Droplets} label="Blood Group" value={profile?.blood_group || '—'} color="bg-amber-600" />
        <StatCard icon={Calendar} label="Age" value={profile?.age ? `${profile.age} yrs` : '—'} color="bg-violet-600" />
        <StatCard icon={Activity} label="Conditions" value={profile?.medical_conditions?.length || 0} color="bg-teal-600" />
      </div>

      {/* Status banners */}
      {profile?.status === 'pending' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <Clock size={18} className="shrink-0" />
          <p className="text-sm">Registration is <strong>pending admin approval</strong>. You will be notified once reviewed.</p>
        </div>
      )}
      {profile?.status === 'approved' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
          <CheckCircle size={18} className="shrink-0" />
          <p className="text-sm">Registration <strong>approved</strong>!
            {profile?.certificate_uid && <> Certificate ID: <span className="font-mono font-bold">{profile.certificate_uid}</span></>}
          </p>
        </div>
      )}
      {profile?.status === 'rejected' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">
          <X size={18} className="shrink-0" />
          <p className="text-sm">Registration was <strong>rejected</strong>. Please contact the administrator.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-800/80 rounded-xl border border-slate-700">
        <Tab id="profile"  label="Profile"         icon={User}        active={activeTab === 'profile'}  onClick={setActiveTab} />
        <Tab id="medical"  label="Medical History"  icon={Stethoscope} active={activeTab === 'medical'}  onClick={setActiveTab} />
        <Tab id="organs"   label="Organs Pledged"   icon={Heart}       active={activeTab === 'organs'}   onClick={setActiveTab} />
        <Tab id="emergency"label="Emergency Info"   icon={Shield}      active={activeTab === 'emergency'}onClick={setActiveTab} />
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <div className="card space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Personal Information</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2 text-sm py-2">
                <Edit3 size={14} /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="btn-secondary flex items-center gap-2 text-sm py-2"><X size={14} /> Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 text-sm py-2"><Save size={14} /> {saving ? 'Saving…' : 'Save'}</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InfoRow icon={User} label="Full Name" value={profile?.name} />
            <InfoRow icon={Droplets} label="Blood Group" value={editing ? (
              <select className="input-field text-sm py-2" value={form.blood_group} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))}>
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            ) : profile?.blood_group} />
            <InfoRow icon={Calendar} label="Age" value={editing ? (
              <input type="number" className="input-field text-sm py-2" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
            ) : `${profile?.age} years`} />
            <InfoRow icon={User} label="Gender" value={editing ? (
              <select className="input-field text-sm py-2" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                {['male','female','other'].map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase()+g.slice(1)}</option>)}
              </select>
            ) : profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : '—'} />
            <InfoRow icon={Phone} label="Contact Number" value={editing ? (
              <input type="tel" className="input-field text-sm py-2" value={form.contact_number} onChange={e => setForm(f => ({ ...f, contact_number: e.target.value }))} />
            ) : profile?.contact_number || '—'} />
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Status</p>
              <span className={statusColor[profile?.status] || 'badge-yellow'}>{profile?.status}</span>
            </div>
            <div className="sm:col-span-2">
              <InfoRow icon={MapPin} label="Address" value={editing ? (
                <div className="space-y-2">
                  <textarea className="input-field text-sm resize-none" rows={2} placeholder="Street address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  <div className="grid grid-cols-3 gap-2">
                    <input className="input-field text-sm py-2" placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                    <input className="input-field text-sm py-2" placeholder="State" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                    <input className="input-field text-sm py-2" placeholder="Pincode" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
                  </div>
                </div>
              ) : `${profile?.address}${profile?.city ? ', ' + profile.city : ''}${profile?.state ? ', ' + profile.state : ''}${profile?.pincode ? ' - ' + profile.pincode : ''}`} />
            </div>
          </div>
        </div>
      )}

      {/* ── MEDICAL HISTORY TAB ── */}
      {activeTab === 'medical' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Stethoscope size={18} className="text-brand-400" /> Medical Conditions</h2>
              {!editingMedical ? (
                <button onClick={() => setEditingMedical(true)} className="btn-secondary flex items-center gap-2 text-sm py-2"><Edit3 size={14} /> Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditingMedical(false)} className="btn-secondary flex items-center gap-2 text-sm py-2"><X size={14} /> Cancel</button>
                  <button onClick={handleMedicalSave} disabled={saving} className="btn-primary flex items-center gap-2 text-sm py-2"><Save size={14} /> {saving ? 'Saving…' : 'Save All'}</button>
                </div>
              )}
            </div>

            {editingMedical ? (
              <div>
                <p className="text-slate-400 text-xs mb-3">Select all that apply:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {CONDITIONS_LIST.map(name => {
                    const selected = medForm.conditions.some(c => c.condition_name === name);
                    return (
                      <button key={name} type="button" onClick={() => toggleCondition(name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${selected ? 'bg-rose-600/20 border-rose-500 text-rose-300' : 'bg-slate-800 border-slate-600/50 text-slate-400 hover:border-slate-500'}`}>
                        {name}
                      </button>
                    );
                  })}
                </div>
                {medForm.conditions.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Selected Conditions — Add Details</p>
                    {medForm.conditions.map((cond, i) => (
                      <div key={i} className="grid grid-cols-4 gap-2 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                        <p className="text-slate-200 text-sm font-medium col-span-4 mb-1">{cond.condition_name}</p>
                        <div>
                          <label className="label text-[10px]">Year Diagnosed</label>
                          <input type="number" className="input-field text-xs py-1.5" placeholder="e.g. 2020"
                            value={cond.diagnosed_year || ''} onChange={e => {
                              const updated = [...medForm.conditions];
                              updated[i] = { ...updated[i], diagnosed_year: e.target.value };
                              setMedForm(f => ({ ...f, conditions: updated }));
                            }} />
                        </div>
                        <div>
                          <label className="label text-[10px]">Severity</label>
                          <select className="input-field text-xs py-1.5" value={cond.severity || 'mild'} onChange={e => {
                            const updated = [...medForm.conditions];
                            updated[i] = { ...updated[i], severity: e.target.value };
                            setMedForm(f => ({ ...f, conditions: updated }));
                          }}>
                            {['mild','moderate','severe'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label text-[10px]">Status</label>
                          <select className="input-field text-xs py-1.5" value={cond.is_current ? 'current' : 'past'} onChange={e => {
                            const updated = [...medForm.conditions];
                            updated[i] = { ...updated[i], is_current: e.target.value === 'current' };
                            setMedForm(f => ({ ...f, conditions: updated }));
                          }}>
                            <option value="current">Current</option>
                            <option value="past">Past</option>
                          </select>
                        </div>
                        <div>
                          <label className="label text-[10px]">Notes</label>
                          <input className="input-field text-xs py-1.5" placeholder="Brief note" value={cond.notes || ''} onChange={e => {
                            const updated = [...medForm.conditions];
                            updated[i] = { ...updated[i], notes: e.target.value };
                            setMedForm(f => ({ ...f, conditions: updated }));
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              profile?.medical_conditions?.length > 0 ? (
                <div className="space-y-3">
                  {profile.medical_conditions.map(c => (
                    <div key={c.condition_id} className="flex items-start justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-700/40">
                      <div>
                        <p className="text-slate-200 text-sm font-medium">{c.condition_name}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{c.notes}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.severity === 'severe' ? 'bg-red-500/20 text-red-400' : c.severity === 'moderate' ? 'bg-amber-500/20 text-amber-400' : 'bg-teal-500/20 text-teal-400'}`}>{c.severity}</span>
                        <span className={`text-[10px] ${c.is_current ? 'text-rose-400' : 'text-slate-500'}`}>{c.is_current ? 'Current' : 'Past'}</span>
                        {c.diagnosed_year && <span className="text-slate-500 text-[10px]">Since {c.diagnosed_year}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-500 text-sm">No medical conditions recorded.</p>
            )}
          </div>

          {/* Allergies */}
          <div className="card">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4"><AlertTriangle size={16} className="text-amber-400" /> Allergies</h3>
            {editingMedical ? (
              <div className="space-y-2">
                {medForm.allergies.map((a, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input className="input-field text-sm py-2 flex-1" placeholder="Allergen (e.g. Penicillin)" value={a.allergen} onChange={e => updateAllergy(idx, 'allergen', e.target.value)} />
                    <input className="input-field text-sm py-2 flex-1" placeholder="Reaction type" value={a.reaction_type} onChange={e => updateAllergy(idx, 'reaction_type', e.target.value)} />
                    <button onClick={() => removeAllergy(idx)} className="text-slate-400 hover:text-red-400 transition-colors"><X size={16} /></button>
                  </div>
                ))}
                <button onClick={addAllergy} className="btn-secondary text-sm py-2 mt-2">+ Add Allergy</button>
              </div>
            ) : (
              profile?.allergies?.length > 0 ? (
                <div className="space-y-2">
                  {profile.allergies.map(a => (
                    <div key={a.allergy_id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-amber-500/20">
                      <span className="text-slate-200 text-sm font-medium">{a.allergen}</span>
                      <span className="text-amber-400 text-xs">{a.reaction_type || 'Reaction not specified'}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-500 text-sm">No known allergies.</p>
            )}
          </div>

          {/* Lifestyle */}
          <div className="card">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4"><Salad size={16} className="text-green-400" /> Lifestyle Information</h3>
            {editingMedical ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">BMI</label>
                  <input type="number" step="0.1" className="input-field text-sm py-2" placeholder="e.g. 23.5"
                    value={medForm.lifestyle?.bmi || ''} onChange={e => setMedForm(f => ({ ...f, lifestyle: { ...f.lifestyle, bmi: e.target.value } }))} />
                </div>
                <div>
                  <label className="label">Smoking</label>
                  <select className="input-field text-sm py-2" value={medForm.lifestyle?.smoker ? 'yes' : 'no'}
                    onChange={e => setMedForm(f => ({ ...f, lifestyle: { ...f.lifestyle, smoker: e.target.value === 'yes' } }))}>
                    <option value="no">Non-smoker</option>
                    <option value="yes">Smoker</option>
                  </select>
                </div>
                <div>
                  <label className="label">Alcohol Use</label>
                  <select className="input-field text-sm py-2" value={medForm.lifestyle?.alcohol_use || 'none'}
                    onChange={e => setMedForm(f => ({ ...f, lifestyle: { ...f.lifestyle, alcohol_use: e.target.value } }))}>
                    {['none','occasional','regular'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Exercise</label>
                  <select className="input-field text-sm py-2" value={medForm.lifestyle?.exercise_freq || 'none'}
                    onChange={e => setMedForm(f => ({ ...f, lifestyle: { ...f.lifestyle, exercise_freq: e.target.value } }))}>
                    {['none','light','moderate','heavy'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Diet Type</label>
                  <select className="input-field text-sm py-2" value={medForm.lifestyle?.diet_type || 'non-vegetarian'}
                    onChange={e => setMedForm(f => ({ ...f, lifestyle: { ...f.lifestyle, diet_type: e.target.value } }))}>
                    {['vegetarian','non-vegetarian','vegan','other'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="label">Past Surgeries</label>
                  <input className="input-field text-sm py-2" placeholder="e.g. Appendectomy 2016, None"
                    value={medForm.lifestyle?.past_surgeries || ''}
                    onChange={e => setMedForm(f => ({ ...f, lifestyle: { ...f.lifestyle, past_surgeries: e.target.value } }))} />
                </div>
                <div className="sm:col-span-3">
                  <label className="label">Current Medications</label>
                  <input className="input-field text-sm py-2" placeholder="e.g. Metformin 500mg, Amlodipine 5mg, None"
                    value={medForm.lifestyle?.current_medications || ''}
                    onChange={e => setMedForm(f => ({ ...f, lifestyle: { ...f.lifestyle, current_medications: e.target.value } }))} />
                </div>
              </div>
            ) : profile?.lifestyle ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { icon: Dumbbell, label: 'BMI', value: profile.lifestyle.bmi || '—' },
                  { icon: Wind, label: 'Smoking', value: profile.lifestyle.smoker ? 'Smoker' : 'Non-smoker' },
                  { icon: Salad, label: 'Alcohol', value: profile.lifestyle.alcohol_use || 'none' },
                  { icon: Dumbbell, label: 'Exercise', value: profile.lifestyle.exercise_freq || 'none' },
                  { icon: Salad, label: 'Diet', value: profile.lifestyle.diet_type || '—' },
                ].map(({ icon: I, label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/40">
                    <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-slate-200 text-sm font-medium capitalize">{value}</p>
                  </div>
                ))}
                {profile.lifestyle.past_surgeries && (
                  <div className="sm:col-span-3 p-3 rounded-xl bg-slate-900/40 border border-slate-700/40">
                    <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Past Surgeries</p>
                    <p className="text-slate-200 text-sm">{profile.lifestyle.past_surgeries}</p>
                  </div>
                )}
                {profile.lifestyle.current_medications && (
                  <div className="sm:col-span-3 p-3 rounded-xl bg-slate-900/40 border border-slate-700/40">
                    <p className="text-slate-500 text-xs uppercase tracking-wide mb-1 flex items-center gap-1"><Pill size={11} /> Current Medications</p>
                    <p className="text-slate-200 text-sm">{profile.lifestyle.current_medications}</p>
                  </div>
                )}
              </div>
            ) : <p className="text-slate-500 text-sm">No lifestyle info recorded. Click Edit to add.</p>}
          </div>
        </div>
      )}

      {/* ── ORGANS TAB ── */}
      {activeTab === 'organs' && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Heart size={18} className="text-rose-400" /> Organs Pledged for Donation</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2 text-sm py-2"><Edit3 size={14} /> Edit</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="btn-secondary flex items-center gap-2 text-sm py-2"><X size={14} /> Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 text-sm py-2"><Save size={14} /> {saving ? 'Saving…' : 'Save'}</button>
              </div>
            )}
          </div>
          <p className="text-slate-400 text-sm mb-4">Each organ stored as a separate normalized record for accurate matching.</p>
          <div className="flex flex-wrap gap-3">
            {ORGANS.map(organ => {
              const isPledged = editing ? form.organs.includes(organ) : donorOrgans.includes(organ);
              return editing ? (
                <button key={organ} type="button" onClick={() => toggleOrgan(organ)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${form.organs.includes(organ) ? 'bg-rose-600/20 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/10' : 'bg-slate-800 border-slate-600/50 text-slate-400 hover:border-slate-500'}`}>
                  {organ}
                </button>
              ) : (
                <div key={organ} className={`px-4 py-2 rounded-xl text-sm font-medium border-2 ${isPledged ? 'bg-rose-600/20 border-rose-500 text-rose-300' : 'bg-slate-800/40 border-slate-700/40 text-slate-600'}`}>
                  {isPledged && <span className="mr-1">✓</span>}{organ}
                </div>
              );
            })}
          </div>
          {donorOrgans.length > 0 && !editing && (
            <p className="text-slate-500 text-xs mt-4">{donorOrgans.length} organ(s) registered in donor_organs table as individual rows (1NF compliant).</p>
          )}
        </div>
      )}

      {/* ── EMERGENCY TAB ── */}
      {activeTab === 'emergency' && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Shield size={18} className="text-brand-400" /> Emergency Contact</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2 text-sm py-2"><Edit3 size={14} /> Edit</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="btn-secondary flex items-center gap-2 text-sm py-2"><X size={14} /> Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 text-sm py-2"><Save size={14} /> {saving ? 'Saving…' : 'Save'}</button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <InfoRow icon={UserCheck} label="Contact Name" value={editing ? (
              <input className="input-field text-sm py-2" value={form.emergency_contact_name} onChange={e => setForm(f => ({ ...f, emergency_contact_name: e.target.value }))} />
            ) : profile?.emergency_contact_name || '—'} />
            <InfoRow icon={Phone} label="Contact Phone" value={editing ? (
              <input type="tel" className="input-field text-sm py-2" value={form.emergency_contact_phone} onChange={e => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))} />
            ) : profile?.emergency_contact_phone || '—'} />
            <InfoRow icon={FileText} label="Relationship" value={editing ? (
              <input className="input-field text-sm py-2" placeholder="e.g. Father, Spouse" value={form.emergency_contact_relation} onChange={e => setForm(f => ({ ...f, emergency_contact_relation: e.target.value }))} />
            ) : profile?.emergency_contact_relation || '—'} />
          </div>
          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-blue-300 text-sm"><strong>Note:</strong> Emergency contact details are stored as structured columns (not as a blob) — 3NF compliant: each attribute depends only on donor_id.</p>
          </div>
        </div>
      )}
    </div>
  );
}
