import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import * as authService from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

export default function OTPVerification({ email, onSuccess }) {
  const { login } = useAuth();
  const [codes,   setCodes]   = useState(['','','','','','']);
  const [loading, setLoading] = useState(false);
  const [resendCd,setResendCd]= useState(60);
  const refs = useRef([]);

  // Countdown for resend button
  useEffect(() => {
    if (resendCd <= 0) return;
    const t = setTimeout(() => setResendCd(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCd]);

  const handleKey = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...codes];
    next[idx] = val;
    setCodes(next);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
    // Auto-submit when all filled
    if (val && idx === 5 && next.every(c => c)) {
      submit(next.join(''));
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setCodes(text.split(''));
      refs.current[5]?.focus();
      submit(text);
    }
  };

  const handleBackspace = (e, idx) => {
    if (e.key === 'Backspace' && !codes[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const submit = async (otp) => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const res = await authService.verifyEmail(email, otp);
      // Store token manually since we get it from verify
      const { user, token } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Email verified! Welcome to StockWise 🎉');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code.');
      setCodes(['','','','','','']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await authService.resendVerification(email);
      toast.success('New code sent! Check your email.');
      setResendCd(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend.');
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-900/30 mb-4">
          <ShieldCheck size={26} className="text-sky-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Check your email</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          We sent a 6-digit code to<br />
          <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>
        </p>
      </div>

      {/* OTP boxes */}
      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {codes.map((c, i) => (
          <input key={i}
            ref={el => refs.current[i] = el}
            type="text" inputMode="numeric" maxLength={1}
            value={c}
            onChange={e => handleKey(e, i)}
            onKeyDown={e => handleBackspace(e, i)}
            className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200
              bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none
              ${c ? 'border-sky-500 shadow-glow' : 'border-slate-200 dark:border-slate-700'}
              focus:border-sky-500 focus:shadow-glow`}
          />
        ))}
      </div>

      <button
        onClick={() => submit(codes.join(''))}
        disabled={loading || codes.some(c => !c)}
        className="btn-primary w-full justify-center">
        {loading ? 'Verifying…' : 'Verify Email'}
      </button>

      <div className="text-center">
        {resendCd > 0 ? (
          <p className="text-sm text-slate-400">Resend code in <span className="font-semibold text-slate-600 dark:text-slate-300">{resendCd}s</span></p>
        ) : (
          <button onClick={resend} className="text-sm text-sky-500 hover:underline inline-flex items-center gap-1">
            <RefreshCw size={13} /> Resend code
          </button>
        )}
      </div>
    </div>
  );
}
