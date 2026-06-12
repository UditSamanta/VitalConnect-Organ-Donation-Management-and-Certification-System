import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Award, Download, Heart, Loader2, AlertCircle } from 'lucide-react';

export default function Certificate() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [certInfo, setCertInfo] = useState(null);
  const [error, setError] = useState(null);

  // Try to get profile info to display on the page
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/donor/profile');
        setCertInfo(data.data);
      } catch {
        // If direct access by id, show generic content
      }
    };
    fetchProfile();
  }, []);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/certificate/download/${id || certInfo?.donor_id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ODMS_Certificate_${id || certInfo?.donor_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Certificate downloaded!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to download certificate.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isApproved = certInfo?.status === 'approved';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg animate-slide-up">
        {/* Certificate preview card */}
        <div className="card border-amber-500/20 bg-gradient-to-b from-amber-900/10 to-slate-800/60 text-center">
          {/* Decorative top border */}
          <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full -mt-6 -mx-6 mb-6" />

          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/30">
            <Award size={36} className="text-white" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Organ Donation Certificate</h1>
          <p className="text-slate-400 text-sm mb-6">Official certification for registered organ donors</p>

          {certInfo && (
            <div className="bg-slate-900/50 rounded-xl p-5 mb-6 text-left space-y-3 border border-slate-700/50">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Donor Name</span>
                <span className="text-white font-semibold">{certInfo.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Blood Group</span>
                <span className="text-white font-semibold">{certInfo.blood_group}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Organs Pledged</span>
                <span className="text-white font-semibold text-right">{(certInfo.organs_to_donate || []).join(', ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span className={`font-semibold ${isApproved ? 'text-emerald-400' : 'text-amber-400'}`}>{certInfo.status}</span>
              </div>
            </div>
          )}

          {!isApproved && certInfo && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm text-left mb-4">
              <AlertCircle size={18} className="shrink-0" />
              Your registration is pending admin approval. The certificate will be available once approved.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-left mb-4">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={loading || (!isApproved && !!certInfo)}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Generating PDF…</>
            ) : (
              <><Download size={18} /> Download Certificate (PDF)</>
            )}
          </button>

          <p className="text-slate-500 text-xs mt-4 flex items-center justify-center gap-1">
            <Heart size={11} className="text-rose-400 fill-rose-400" />
            Issued by Organ Donation Management System
          </p>
        </div>
      </div>
    </div>
  );
}
