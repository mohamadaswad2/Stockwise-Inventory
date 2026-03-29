import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import * as authService from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

export default function OTPVerification({ email, onSuccess, onBack }) {
  const { completeVerification } = useAuth();
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

  const submit = async (otp) => {
    if (otp.length !== 6 || loading) return;
    setLoading(true);
    try {
      const res = await authService.verifyEmail(email, otp);
      const { user, token } = res.data.data;
      completeVerification(user, token);
      toast.success('Email verified! Welcome 🎉');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code.');
      setCodes(['','','','','','']);
      refs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g,'').slice(-1);
    const next = [...codes]; next[idx] = val; setCodes(next);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
    if (val && idx === 5 && next.every(c => c)) submit(next.join(''));
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !codes[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handlePaste = (e) => {
    const t = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (t.length === 6) { setCodes(t.split('')); setTimeout(() => submit(t), 50); }
  };

  const resend = async () => {
    try {
      await authService.resendVerification(email);
      toast.success('New code sent!');
      setCd(60);
    } catch (err) { toast.error('Failed to resend.'); }
  };

  return (
    <div className="space-y-6 animate-ios-in">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: 'var(--accent3)' }}>
          <ArrowLeft size={15} /> Back
        </button>
      )}

      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <ShieldCheck size={24} style={{ color: 'var(--accent3)' }} />
        </div>
        <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>Check your email</h2>
        <p className="text-sm" style={{ color: 'var(--text2)' }}>
          6-digit code sent to<br />
          <strong style={{ color: 'var(--text)' }}>{email}</strong>
        </p>
      </div>

      {/* OTP boxes */}
      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {codes.map((c, i) => (
          <input key={i} ref={el => refs.current[i] = el}
            type="text" inputMode="numeric" maxLength={1}
            value={c} disabled={loading}
            onChange={e => handleChange(e, i)}
            onKeyDown={e => handleKeyDown(e, i)}
            className="w-11 h-13 text-center text-xl font-bold rounded-xl outline-none transition-all duration-200"
            style={{
              height: '52px',
              background: c ? 'rgba(99,102,241,0.1)' : 'var(--surface2)',
              color: 'var(--text)',
              border: `2px solid ${c ? 'var(--accent)' : 'var(--border)'}`,
              boxShadow: c ? '0 0 12px var(--glow)' : 'none',
            }}
          />
        ))}
      </div>

      <button onClick={() => submit(codes.join(''))}
        disabled={loading || codes.some(c => !c)} className="btn-primary w-full">
        {loading ? 'Verifying…' : 'Verify Email'}
      </button>

      <div className="text-center">
        {cd > 0
          ? <p className="text-sm" style={{ color: 'var(--text2)' }}>
              Resend in <strong style={{ color: 'var(--text)' }}>{cd}s</strong>
            </p>
          : <button onClick={resend} className="text-sm font-semibold inline-flex items-center gap-1.5"
              style={{ color: 'var(--accent3)' }}>
              <RefreshCw size={13} /> Resend code
            </button>
        }
      </div>
      <p className="text-center text-xs" style={{ color: 'var(--text3)' }}>
        Check your spam folder if you don't see it.
      </p>
    </div>
  );
}
