import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle2, Circle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import OTPVerification from './OTPVerification';

const CHECKS = [
  { label: 'At least 8 characters',    test: p => p.length >= 8 },
  { label: 'Uppercase letter (A–Z)',    test: p => /[A-Z]/.test(p) },
  { label: 'Lowercase letter (a–z)',    test: p => /[a-z]/.test(p) },
  { label: 'Number (0–9)',             test: p => /[0-9]/.test(p) },
  { label: 'Special character (!@#…)', test: p => /[^A-Za-z0-9]/.test(p) },
];

function StrengthMeter({ password }) {
  if (!password) return null;
  const passed = CHECKS.filter(c => c.test(password)).length;
  const colors = ['#ef4444','#f59e0b','#f59e0b','#22c55e','#6366f1'];
  const labels = ['Very Weak','Weak','Fair','Strong','Very Strong'];
  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full" style={{ background: 'var(--surface3)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(passed/CHECKS.length)*100}%`, background: colors[passed-1]||'transparent' }} />
        </div>
        <span className="text-xs font-bold w-20 text-right"
          style={{ color: colors[passed-1]||'var(--text3)' }}>
          {labels[passed-1]||'Too Weak'}
        </span>
      </div>
      <div className="space-y-1">
        {CHECKS.map(c => {
          const ok = c.test(password);
          return (
            <div key={c.label} className="flex items-center gap-2">
              {ok ? <CheckCircle2 size={12} style={{color:'var(--green)',flexShrink:0}}/>
                  : <Circle      size={12} style={{color:'var(--text3)',flexShrink:0}}/>}
              <span className="text-xs" style={{color: ok?'var(--green)':'var(--text2)'}}>{c.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// TOS Modal
function TOSModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '80vh' }}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Terms of Service</h2>
          <button onClick={onClose} className="btn-icon w-8 h-8 rounded-xl"><X size={15}/></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto text-sm space-y-4" style={{ color: 'var(--text2)', maxHeight: '60vh' }}>
          <div>
            <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>1. Acceptance</p>
            <p>By creating a StockWise account, you agree to these Terms of Service. If you do not agree, please do not use our service.</p>
          </div>
          <div>
            <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>2. Your Data</p>
            <p>You retain ownership of all data you enter into StockWise. We will never sell your data to third parties. Your inventory data is stored securely and encrypted.</p>
          </div>
          <div>
            <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>3. Free Trial</p>
            <p>New accounts receive a 30-day Deluxe trial. After the trial ends, your account is downgraded to Free tier. Your data is never deleted — it is locked until you subscribe.</p>
          </div>
          <div>
            <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>4. Subscription</p>
            <p>Paid subscriptions are billed monthly or annually. You may cancel at any time. Refunds are handled on a case-by-case basis within 7 days of payment.</p>
          </div>
          <div>
            <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>5. Acceptable Use</p>
            <p>You agree not to use StockWise for illegal activities, to upload malicious content, or to attempt to breach our security systems.</p>
          </div>
          <div>
            <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>6. Service Availability</p>
            <p>We aim for 99.9% uptime but cannot guarantee uninterrupted service. We are not liable for losses caused by service interruptions.</p>
          </div>
          <div>
            <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>7. Changes</p>
            <p>We may update these terms with 30 days notice via email. Continued use after changes constitutes acceptance.</p>
          </div>
          <div>
            <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>8. Contact</p>
            <p>For any questions regarding these terms, contact us at support@stockwise.app</p>
          </div>
          <p className="text-xs" style={{ color: 'var(--text3)' }}>Last updated: March 2026</p>
        </div>
        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} className="btn-primary w-full">I Understand</button>
        </div>
      </div>
    </div>
  );
}

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [form,     setForm]     = useState({ name:'', email:'', password:'' });
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState('register');
  const [agreedTOS,setAgreedTOS]= useState(false);
  const [showTOS,  setShowTOS]  = useState(false);

  const isStrong = CHECKS.every(c => c.test(form.password));
  const canSubmit = isStrong && agreedTOS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStrong)   { toast.error('Password does not meet all requirements.'); return; }
    if (!agreedTOS)  { toast.error('Please agree to the Terms of Service.'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Check your email.');
      setStep('verify');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  if (step === 'verify') return (
    <OTPVerification email={form.email}
      onSuccess={() => router.push('/dashboard')}
      onBack={() => setStep('register')} />
  );

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input type="text" className="input" placeholder="Ahmad Rizal"
            value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required />
        </div>
        <div>
          <label className="label">Email Address</label>
          <input type="email" className="input" placeholder="you@example.com"
            value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required />
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input type={showPw?'text':'password'} className="input pr-11"
              placeholder="Create a strong password"
              value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} required />
            <button type="button" onClick={() => setShowPw(v=>!v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ color: 'var(--text3)' }}>
              {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
          <StrengthMeter password={form.password} />
        </div>

        {/* Trial badge */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <span className="flex-shrink-0">✨</span>
          <span style={{ color: 'var(--accent3)' }}>
            <strong>30 days Deluxe FREE</strong> — all features unlocked. No credit card required.
          </span>
        </div>

        {/* TOS Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="flex-shrink-0 mt-0.5">
            <input type="checkbox" className="sr-only" checked={agreedTOS}
              onChange={e => setAgreedTOS(e.target.checked)} />
            <div onClick={() => setAgreedTOS(v => !v)}
              className="w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150 cursor-pointer"
              style={{
                background: agreedTOS ? 'var(--accent)' : 'var(--surface2)',
                border: `2px solid ${agreedTOS ? 'var(--accent)' : 'var(--border2)'}`,
              }}>
              {agreedTOS && <span className="text-white text-xs font-black">✓</span>}
            </div>
          </div>
          <span className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>
            I agree to the{' '}
            <button type="button" onClick={() => setShowTOS(true)}
              className="font-bold underline underline-offset-2"
              style={{ color: 'var(--accent3)' }}>
              Terms of Service
            </button>
            {' '}and confirm I am at least 18 years old.
          </span>
        </label>

        <button type="submit" disabled={loading || !canSubmit} className="btn-primary w-full">
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <p className="text-center text-sm" style={{ color: 'var(--text2)' }}>
          Have an account?{' '}
          <Link href="/auth/login" className="font-bold" style={{ color: 'var(--accent3)' }}>Sign in</Link>
        </p>
      </form>

      {showTOS && <TOSModal onClose={() => setShowTOS(false)} />}
    </>
  );
}
