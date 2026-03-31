import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle2, Circle, Lock } from 'lucide-react';
import { resetPassword } from '../../services/auth.service';

const CHECKS = [
  { label: 'At least 8 characters',    test: p => p.length >= 8 },
  { label: 'Uppercase letter',          test: p => /[A-Z]/.test(p) },
  { label: 'Lowercase letter',          test: p => /[a-z]/.test(p) },
  { label: 'Number',                    test: p => /[0-9]/.test(p) },
  { label: 'Special character',         test: p => /[^A-Za-z0-9]/.test(p) },
];
const noSpaces = v => v.replace(/\s/g, ''); // #6 fix

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token, email } = router.query;
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  const passed   = CHECKS.filter(c => c.test(password)).length;
  const isStrong = passed === CHECKS.length;
  const colors   = ['#ef4444','#f59e0b','#f59e0b','#22c55e','#6366f1'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStrong)            { toast.error('Password too weak.'); return; }
    if (password !== confirm) { toast.error('Passwords do not match.'); return; }
    if (!token || !email)     { toast.error('Invalid reset link.'); return; }
    setLoading(true);
    try {
      await resetPassword({ email, token, password });
      setDone(true);
      toast.success('Password reset!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally { setLoading(false); }
  };

  if (done) return (
    <>
      <Head><title>Password Reset — StockWise</title></Head>
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm text-center animate-ios-in">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(99,102,241,0.15)' }}>
            <CheckCircle2 size={36} style={{ color: 'var(--accent3)' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Password updated!</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text2)' }}>You can now sign in with your new password.</p>
          <Link href="/auth/login" className="btn-primary w-full justify-center">Go to Sign In</Link>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Head><title>Reset Password — StockWise</title></Head>
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm animate-ios-in">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>SW</div>
            <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>StockWise</span>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(99,102,241,0.12)' }}>
            <Lock size={22} style={{ color: 'var(--accent3)' }} />
          </div>
          <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>Set new password</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>Choose a strong password.</p>
          <div className="card-glow p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} className="input pr-11"
                    placeholder="Create strong password"
                    value={password} onChange={e => setPassword(noSpaces(e.target.value))} required />
                  <button type="button" onClick={() => setShowPw(v=>!v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg"
                    style={{ color: 'var(--text3)' }}>
                    {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                {password && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--surface2)' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(passed/CHECKS.length)*100}%`, background: colors[passed-1]||'transparent' }} />
                      </div>
                      <span className="text-xs font-bold w-20 text-right"
                        style={{ color: colors[passed-1]||'var(--text3)' }}>
                        {['','Weak','Fair','Fair','Strong','Very Strong'][passed]}
                      </span>
                    </div>
                    {CHECKS.map(c => { const ok = c.test(password); return (
                      <div key={c.label} className="flex items-center gap-2">
                        {ok ? <CheckCircle2 size={12} style={{color:'var(--green)',flexShrink:0}}/>
                            : <Circle      size={12} style={{color:'var(--text3)',flexShrink:0}}/>}
                        <span className="text-xs" style={{color:ok?'var(--green)':'var(--text2)'}}>{c.label}</span>
                      </div>
                    );})}
                  </div>
                )}
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input type="password" className="input" placeholder="Re-enter password"
                  value={confirm} onChange={e => setConfirm(noSpaces(e.target.value))} required />
                {confirm && password !== confirm && (
                  <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>Passwords do not match.</p>
                )}
              </div>
              <button type="submit" disabled={loading || !isStrong} className="btn-primary w-full">
                {loading ? 'Updating…' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
