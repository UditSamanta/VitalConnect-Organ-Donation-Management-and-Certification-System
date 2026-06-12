import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Hospital, Award, ArrowRight, CheckCircle, Users, GitMerge, Clock, FileCheck } from 'lucide-react';
import api from '../lib/api';

function AnimatedCount({ value, duration = 1500 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value && value !== 0) return;
    const steps = 60;
    const step = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{display}</span>;
}

export default function Landing() {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    api.get('/public/stats')
      .then(({ data }) => { if (data.success) setStats(data.stats); })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] selection:bg-blue-500/30 overflow-hidden font-['Outfit']">

      {/* ── Background Elements ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        {/* Animated Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] animate-blob mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[150px] animate-blob animation-delay-2000 mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[20%] w-[800px] h-[800px] rounded-full bg-cyan-600/10 blur-[150px] animate-blob animation-delay-4000 mix-blend-screen" />
      </div>

      {/* ── Hero Section ── */}
      <section className="relative z-10 pt-32 pb-24 px-4">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          
          <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-sm text-slate-300 mb-8 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Government Certified Platform • Live API connected
            </div>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold text-white leading-[1.05] tracking-tight mb-8 fade-in-up" style={{ animationDelay: '0.2s' }}>
            Transforming Hope Into <br className="hidden md:block"/>
            <span className="gradient-text">Second Chances</span>
          </h1>

          <p className="text-xl sm:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 font-['Inter'] font-light leading-relaxed fade-in-up" style={{ animationDelay: '0.3s' }}>
            A state-of-the-art organ allocation network. We bridge the gap between altruistic donors and top-tier hospitals with transparent matching algorithms.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center w-full sm:w-auto fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/register" className="btn-primary flex items-center justify-center gap-2 text-lg py-4 px-10 pulse-glow">
              Pledge Organs Now <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="px-10 py-4 rounded-full font-semibold text-white border border-white/20 hover:bg-white/10 transition-all duration-300">
              Sign In Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Live Stats (Real Data) ── */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 relative z-10">
              {[
                { label: 'Registered Donors', value: stats?.total_donors, icon: Users, color: 'text-blue-400' },
                { label: 'Top Hospitals',     value: stats?.total_hospitals, icon: Hospital, color: 'text-purple-400' },
                { label: 'Matches Made',      value: stats?.total_matches, icon: GitMerge, color: 'text-emerald-400' },
                { label: 'Certificates Issued', value: stats?.total_certs, icon: Award, color: 'text-amber-400' },
              ].map((stat, i) => (
                <div key={stat.label} className="text-center group fade-in-up" style={{ animationDelay: `${0.5 + (i * 0.1)}s` }}>
                  <div className={`w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300 ${stat.color}`}>
                    <stat.icon size={26} />
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                    {loadingStats ? <span className="text-white/20 animate-pulse">0</span> 
                      : <AnimatedCount value={stat.value} />}<span className={stat.color}>+</span>
                  </h3>
                  <p className="text-slate-400 font-['Inter'] text-sm tracking-wide uppercase">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Visual Features Grid ── */}
      <section className="relative z-10 py-32 px-4 bg-black/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20 fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Engineered for Precision</h2>
            <p className="text-xl text-slate-400 font-['Inter'] font-light">From 5NF normalized databases to real-time concurrency controls, our architecture ensures zero errors in life-saving allocations.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group rounded-3xl bg-slate-900/50 border border-white/5 p-8 hover:bg-slate-800/80 hover:border-blue-500/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-8 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Shield size={28} className="text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Immutable Audit Trail</h3>
              <p className="text-slate-400 font-['Inter'] leading-relaxed">
                Every state change is tracked via an append-only audit log. Rollbacks and point-in-time recovery ensure full data integrity and transparency.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-3xl bg-slate-900/50 border border-white/5 p-8 hover:bg-slate-800/80 hover:border-purple-500/30 transition-all duration-500 md:-translate-y-8">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-8 border border-purple-500/20 group-hover:scale-110 transition-transform">
                <Heart size={28} className="text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Smart Matching Engine</h3>
              <p className="text-slate-400 font-['Inter'] leading-relaxed">
                Utilizes algorithmic evaluation of blood groups and organs. Wrapped in pessimistic locks (`FOR UPDATE`) to prevent race conditions during matches.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-3xl bg-slate-900/50 border border-white/5 p-8 hover:bg-slate-800/80 hover:border-emerald-500/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-8 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <FileCheck size={28} className="text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Verified Ecosystem</h3>
              <p className="text-slate-400 font-['Inter'] leading-relaxed">
                Hospitals undergo admin verification. Approved donors receive dynamically generated PDF certificates bearing unique cryptographic IDs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Workflow Diagram Section ── */}
      <section className="relative z-10 py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-[3rem] p-10 md:p-16 border-white/10 relative overflow-hidden">
            <div className="md:flex items-center gap-16 relative z-10">
              <div className="md:w-1/2 mb-10 md:mb-0">
                <h2 className="text-4xl font-bold text-white mb-6 leading-tight">How the network saves lives</h2>
                <ul className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                  {[
                    { icon: Heart, text: 'Donor registers pledges and detailed medical conditions.', color: 'text-rose-400' },
                    { icon: Hospital, text: 'Hospitals request organs for critical patients.', color: 'text-blue-400' },
                    { icon: GitMerge, text: 'Algorithms map exact compatibility and lock records.', color: 'text-purple-400' },
                    { icon: Award, text: 'Admin approves generating official digital certificates.', color: 'text-emerald-400' }
                  ].map((step, i) => (
                    <li key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#020617] bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-white transition-colors duration-300 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow flex-col absolute left-0 md:left-1/2">
                         <step.icon size={16} className={step.color} />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white/5 border border-white/5 group-hover:border-white/20 transition-colors">
                        <p className="text-slate-300 font-['Inter'] leading-relaxed">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:w-1/2">
                 {/* Visual Abstract representation of database tables */}
                 <div className="relative w-full aspect-square max-w-sm mx-auto">
                    <div className="absolute top-0 right-10 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl animate-blob"></div>
                    <div className="absolute bottom-10 left-10 w-56 h-56 bg-emerald-600/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
                    
                    <div className="absolute top-1/4 left-10 p-4 rounded-xl glass border-purple-500/30 animate-float">
                      <div className="h-2 w-16 bg-purple-400/50 rounded mb-2"></div>
                      <div className="h-2 w-24 bg-purple-400/30 rounded"></div>
                    </div>
                    
                    <div className="absolute top-1/2 right-0 p-5 rounded-xl glass border-blue-500/30 animate-float-delayed">
                      <div className="h-2 w-20 bg-blue-400/50 rounded mb-2"></div>
                      <div className="h-2 w-12 bg-blue-400/30 rounded mb-2"></div>
                      <div className="h-2 w-24 bg-blue-400/30 rounded"></div>
                    </div>

                    <div className="absolute bottom-1/4 left-20 p-4 rounded-xl glass border-rose-500/30 animate-float">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="w-4 h-4 rounded-full bg-rose-400/50"></div>
                         <div className="h-2 w-16 bg-rose-400/50 rounded"></div>
                      </div>
                      <div className="h-2 w-32 bg-rose-400/30 rounded"></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/10 bg-[#020617] py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400">
          <div className="flex items-center gap-3">
            <Heart size={20} className="text-rose-500 fill-rose-500" />
            <span className="font-bold text-xl text-white tracking-tight">ODMS</span>
          </div>
          <p className="font-['Inter'] text-sm">© 2026 Organ Donation Management System. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-white transition-colors">Admin Portal</Link>
            <Link to="/register" className="hover:text-white transition-colors">Pledge</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
