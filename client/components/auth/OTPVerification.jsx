import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import * as authService from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

export default function OTPVerification({ email, onSuccess }) {
  const { login: authLogin } = useAuth();
  const [codes,   setCodes]   = useState(['','','','','','']);
  const [loading, setLoading] = useState(false);
  const [cd,      setCd]      = useState(60);
  const refs = useRef([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (cd <= 0) return;
    const t = setTimeout(() => setCd(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [cd]);

  const reset = () => {
    setCodes(['','','','','','']);
    setTimeout(() => refs.current[0]?.focus(), 50);
  };

  const submit = async (otp) => {
    if (otp.length !== 6 || loading) return;
    setLoading(true);
    try {
      const res = await authService.verifyEmail(email, otp);

      // Safely extract token and user — guard against unexpected response shape
      const payload = res?.data?.data ?? res?.data ?? {};
      const { user, token } = payload;

      if (!token || !user) {
        // Verify API succeeded (2xx) but shape unexpected — log and continue
        console.error('[OTP] Unexpected response shape:', JSON.stringify(res?.data));
        toast.success('Email verified! Welcome 🎉');
        onSuccess?.();
        return;
      }

      // Store via localStorage directly (same as AuthContext does internally)
      // Do NOT use authLogin() here — login() calls /auth/login endpoint
      // We already have the token from verify, just store it
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Email verified! Welcome 🎉');
      onSuccess?.();
    } catch (err) {
      const msg    = err?.response?.data?.message || 'Invalid code.';
      const status = err?.response?.status;

      // If backend says already verified — email was verified on a previous attempt
      // but frontend crashed. Just let them proceed.
      if (msg.toLowerCase().includes('already verified')) {
        toast.success('Email already verified. Redirecting…');
        onSuccess?.();
        return;
      }

      toast.error(msg);
      reset();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e, idx) => {
    const val  = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...codes];
    next[idx]  = val;
    setCodes(next);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
    if (val && idx === 5 && next.every(c => c)) submit(next.join(''));
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !codes[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handlePaste = (e) => {
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (t.length === 6) { setCodes(t.split('')); submit(t); }
  };

  const resend = async () => {
    try {
      await authService.resendVerification(email);
      toast.success('New code sent!');
      setCd(60);
      reset();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend.');
    }
  };

  return (
    <div className="space-y-6 animate-ios-in">
      <div className="text-center">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(0,122,255,0.1)' }}>
          <ShieldCheck size={28} style={{ color: 'var(--accent3)' }} />
        </div>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>Check your email</h2>
        <p className="text-sm" style={{ color: 'var(--text2)' }}>
          Code sent to <strong style={{ color: 'var(--text)' }}>{email}</strong>
        </p>
      </div>

      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {codes.map((c, i) => (
          <input key={i} ref={el => refs.current[i] = el}
            type="text" inputMode="numeric" maxLength={1}
            value={c}
            onChange={e => handleChange(e, i)}
            onKeyDown={e => handleKeyDown(e, i)}
            className="w-12 h-14 text-center text-2xl font-bold rounded-2xl outline-none transition-all duration-200"
            style={{
              background: 'var(--surface2)',
              color:      'var(--text)',
              border:     `2px solid ${c ? 'var(--accent3)' : 'transparent'}`,
              boxShadow:  c ? '0 0 0 3px rgba(0,122,255,0.15)' : 'none',
            }}
          />
        ))}
      </div>

      <button
        onClick={() => submit(codes.join(''))}
        disabled={loading || codes.some(c => !c)}
        className="btn-primary w-full">
        {loading ? 'Verifying…' : 'Verify Email'}
      </button>

      <div className="text-center">
        {cd > 0
          ? <p className="text-sm" style={{ color: 'var(--text2)' }}>
              Resend in <span className="font-semibold" style={{ color: 'var(--text)' }}>{cd}s</span>
            </p>
          : <button onClick={resend} className="text-sm font-semibold inline-flex items-center gap-1.5"
              style={{ color: 'var(--accent3)' }}>
              <RefreshCw size={13} /> Resend code
            </button>
        }
      </div>
    </div>
  );
}
