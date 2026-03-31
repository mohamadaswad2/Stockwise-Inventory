import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { forgotPassword } from '../../services/auth.service';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent! Check your inbox.');
    } catch (err) {
      // #5 fix — show specific error if email not found
      const msg = err.response?.data?.message || 'Something went wrong.';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <>
      <Head><title>Forgot Password — StockWise</title></Head>
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm animate-ios-in">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>SW</div>
            <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>StockWise</span>
          </div>

          {sent ? (
            <div className="card-glow p-8 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(34,197,94,0.12)' }}>
                <CheckCircle size={28} style={{ color: 'var(--green)' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Check your inbox</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>
                We sent a reset link to <strong style={{ color: 'var(--text)' }}>{email}</strong>
              </p>
              <p className="text-xs mb-6" style={{ color: 'var(--text3)' }}>Check spam if you don't see it.</p>
              <Link href="/auth/login" className="btn-primary w-full justify-center">Back to Sign In</Link>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm font-medium mb-6"
                style={{ color: 'var(--accent3)' }}>
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
              <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>
                Forgot password?
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>
                Enter your registered email and we'll send a reset link.
              </p>
              <div className="card-glow p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Email Address</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
                      <input type="email" className="input pl-10" placeholder="you@example.com"
                        value={email} onChange={e => setEmail(e.target.value)}
                        autoComplete="email" inputMode="email" required />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? 'Checking…' : 'Send Reset Link'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
