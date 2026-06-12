import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard, Menu, X, Activity } from 'lucide-react';
import { useState } from 'react';

const roleLinks = {
  donor: [
    { to: '/donor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/donor/profile', label: 'My Profile', icon: User },
  ],
  hospital: [
    { to: '/hospital/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const links = user ? (roleLinks[user.role] || []) : [];

  return (
    <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo - Redesigned for a highly premium medical-tech brand feel */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 shadow-xl shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
              <div className="absolute inset-0 bg-white/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
              <Activity size={22} className="text-white relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className="font-['Outfit'] font-black text-2xl text-white tracking-widest leading-none drop-shadow-sm">
                ODMS<span className="text-blue-500">.</span>
              </span>
              <span className="font-['Inter'] font-bold text-[10px] text-blue-400 tracking-[0.25em] uppercase leading-none mt-1.5 opacity-80">
                Network
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`sidebar-link font-['Inter'] ${location.pathname.startsWith(to) ? 'sidebar-link-active' : ''}`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 rounded-2xl border border-white/5 shadow-inner">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                    <User size={16} className="text-blue-400" />
                  </div>
                  <div className="text-sm font-['Inter']">
                    <p className="font-bold text-slate-200 leading-tight">{user.name}</p>
                    <p className="text-blue-400 text-xs font-semibold tracking-wider uppercase mt-0.5">{user.role}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="btn-secondary flex items-center gap-2 text-sm font-['Outfit'] py-2.5 px-5">
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-base font-['Outfit'] py-2.5 px-6">Sign In</Link>
                <Link to="/register" className="btn-primary text-base font-['Outfit'] py-2.5 px-6 group flex items-center gap-2">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-slate-400" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/5 py-4 space-y-2 pb-6">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)} className={`sidebar-link font-['Inter'] ${location.pathname.startsWith(to) ? 'sidebar-link-active' : ''}`}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/5 mt-4">
              {user ? (
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="sidebar-link w-full text-rose-400 hover:text-rose-300 font-['Inter']">
                  <LogOut size={18} /> Logout
                </button>
              ) : (
                <div className="flex flex-col gap-3 px-4">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-center text-base py-3">Sign In</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-center text-base py-3">Get Started</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
