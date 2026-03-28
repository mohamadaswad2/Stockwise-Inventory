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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Head><title>Forgot Password — StockWise</title></Head>
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm animate-ios-in">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>SW</div>
            <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>StockWise</span>
          </div>

          {sent ? (
            /* Success state */
            <div className="card-glow p-8 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(34,197,94,0.12)' }}>
                <CheckCircle size={28} style={{ color: 'var(--green)' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Check your inbox</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>
                If <strong style={{ color: 'var(--text)' }}>{email}</strong> is registered,
                you'll receive a reset link shortly.
              </p>
              <p className="text-xs mb-6" style={{ color: 'var(--text3)' }}>
                Don't see it? Check your spam folder.
              </p>
              <Link href="/auth/login" className="btn-primary w-full">
                Back to Sign In
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <Link href="/auth/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium mb-6"
                style={{ color: 'var(--accent3)' }}>
                <ArrowLeft size={16} /> Back to Sign In
              </Link>

              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Forgot password?</h1>
              <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>
                Enter your email and we'll send you a reset link.
              </p>

              <div className="card-glow p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Email Address</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--text3)' }} />
                      <input type="email" className="input pl-10" placeholder="you@example.com"
                        value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? 'Sending…' : 'Send Reset Link'}
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
