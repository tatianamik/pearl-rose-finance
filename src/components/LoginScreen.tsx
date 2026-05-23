import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, KeyRound } from 'lucide-react';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/agd-budgets/api/auth/request-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header Art */}
        <div className="bg-rose-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-900/20 rounded-full -translate-x-8 translate-y-8" />
          
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-inner">
            <span className="text-3xl">🌸</span>
          </div>
          <h1 className="text-2xl font-serif text-white tracking-wide">Pearl & Rose</h1>
          <p className="text-rose-100 text-sm mt-1 uppercase tracking-widest font-bold">Secure Access Portal</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {success ? (
            <div className="text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">✨ Link Sent!</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                We just emailed a magic access link to <strong>{email}</strong>. Click it to securely enter your dashboard instantly. No password required.
              </p>
              
              <div className="pt-4 border-t border-slate-100 mt-6">
                <p className="text-xs text-slate-400 italic">
                  (Check your Inbox Simulator widget in the bottom right!)
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-lg font-bold text-slate-800">Welcome Back</h2>
                <p className="text-slate-500 text-sm">Enter your chapter or advisor email address to log in.</p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100 font-medium text-center">
                  {error}
                </div>
              )}

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-700 font-medium"
                    placeholder="e.g. vpf.nu.delta@agd.org"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !email}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send Magic Link <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-6">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Passwordless, secure authentication.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
