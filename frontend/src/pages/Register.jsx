import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Heart, User, Mail, Lock, Phone, Droplets, UserCheck, Hospital, Eye, EyeOff } from 'lucide-react';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const organs = ['Kidney', 'Liver', 'Heart', 'Lungs', 'Pancreas', 'Corneas', 'Skin', 'Bone Marrow'];

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState('donor');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    // donor fields — match backend: age, gender, blood_group, address, contact_number, organs, emergency_contact
    age: '', blood_group: '', gender: '', address: '', emergency_contact: '',
    organs: [],
    // hospital fields — match backend: hospital_name, address, contact_number, license_number
    hospital_name: '', license_number: '', contact_number: '',
  });

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const toggleOrgan = (organ) => {
    setForm(f => ({
      ...f,
      organs: f.organs.includes(organ)
        ? f.organs.filter(o => o !== organ)
        : [...f.organs, organ],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === 'donor' && form.organs.length === 0) {
      toast.error('Please select at least one organ to donate.');
      return;
    }
    setLoading(true);
    try {
      // Build role-specific payload matching backend expectations exactly
      let payload;
      if (role === 'donor') {
        payload = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: 'donor',
          // Donor-profile fields (sent during registration, backend creates donor row separately via /donor/register)
          _donorData: {
            age: parseInt(form.age) || 18,
            gender: form.gender,
            blood_group: form.blood_group,
            address: form.address,
            contact_number: form.phone,
            organs: form.organs,
            emergency_contact: form.emergency_contact || form.phone,
          }
        };
        // Step 1: register user account
        const { data: authData } = await api.post('/auth/register', {
          name: form.name,
          email: form.email,
          password: form.password,
          role: 'donor',
        });

        // Step 2: immediately login to get token
        const { data: loginData } = await api.post('/auth/login', {
          email: form.email,
          password: form.password,
        });

        // Store token temporarily so donor/register call is authenticated
        const tempToken = loginData.token;
        localStorage.setItem('odms_token', tempToken);

        // Step 3: create donor profile
        await api.post('/donor/register', {
          age: parseInt(form.age) || 18,
          gender: form.gender,
          blood_group: form.blood_group,
          address: form.address,
          contact_number: form.phone,
          organs: form.organs,
          emergency_contact: form.emergency_contact || form.phone,
        });

        // Clean up temp token (they need to login properly)
        localStorage.removeItem('odms_token');
        toast.success('Registration successful! Please login to continue.');
        navigate('/login');
      } else {
        // Hospital registration
        const { data: authData } = await api.post('/auth/register', {
          name: form.name,
          email: form.email,
          password: form.password,
          role: 'hospital',
        });

        // Login to get token for hospital profile creation
        const { data: loginData } = await api.post('/auth/login', {
          email: form.email,
          password: form.password,
        });
        localStorage.setItem('odms_token', loginData.token);

        // Create hospital profile
        await api.post('/hospital/register', {
          hospital_name: form.hospital_name,
          address: form.address || form.hospital_name + ' Hospital',
          contact_number: form.phone,
          license_number: form.license_number,
        });

        localStorage.removeItem('odms_token');
        toast.success('Hospital registered successfully! Please login.');
        navigate('/login');
      }
    } catch (err) {
      localStorage.removeItem('odms_token');
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[500px] bg-violet-600/7 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-2xl animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-brand-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <Heart size={26} className="text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-1">Join the ODMS platform today</p>
        </div>

        {/* Role switcher */}
        <div className="flex gap-2 p-1 bg-slate-800 rounded-xl mb-6 border border-slate-700">
          {[{ id: 'donor', label: 'Donor', icon: UserCheck }, { id: 'hospital', label: 'Hospital', icon: Hospital }].map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setRole(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${role === id ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Common fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" className="input-field pl-10" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" className="input-field pl-10" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPwd ? 'text' : 'password'} className="input-field pl-10 pr-10" placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
                  <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200" onClick={() => setShowPwd(!showPwd)}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="tel" className="input-field pl-10" placeholder="+91 9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                </div>
              </div>
            </div>

            {/* Donor-specific fields */}
            {role === 'donor' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Age</label>
                    <input type="number" min="18" max="120" className="input-field" placeholder="25" value={form.age} onChange={e => set('age', e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Blood Group</label>
                    <div className="relative">
                      <Droplets size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select className="input-field pl-10 appearance-none" value={form.blood_group} onChange={e => set('blood_group', e.target.value)} required>
                        <option value="">Select</option>
                        {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Gender</label>
                    <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)} required>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Address</label>
                    <textarea className="input-field resize-none" rows={2} placeholder="Your full address" value={form.address} onChange={e => set('address', e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Emergency Contact</label>
                    <input type="tel" className="input-field" placeholder="Emergency contact number" value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label mb-2">Organs to Donate <span className="text-slate-500 font-normal">(select all that apply)</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {organs.map(organ => (
                      <button key={organ} type="button" onClick={() => toggleOrgan(organ)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${form.organs.includes(organ) ? 'bg-brand-600/20 border-brand-500 text-brand-300' : 'bg-slate-800 border-slate-600/50 text-slate-400 hover:border-slate-500'}`}>
                        {organ}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Hospital-specific fields */}
            {role === 'hospital' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Hospital Name</label>
                  <input type="text" className="input-field" placeholder="City General Hospital" value={form.hospital_name} onChange={e => set('hospital_name', e.target.value)} required />
                </div>
                <div>
                  <label className="label">License Number</label>
                  <input type="text" className="input-field" placeholder="HOS-2025-XXXX" value={form.license_number} onChange={e => set('license_number', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Hospital Address</label>
                  <input type="text" className="input-field" placeholder="123 Medical Ave, City" value={form.address} onChange={e => set('address', e.target.value)} required />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : null}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
