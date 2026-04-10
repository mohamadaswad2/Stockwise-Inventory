import Head from 'next/head';
import Script from 'next/script';
import RegisterForm from '../../components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <>
      <Head><title>Get Started — StockWise</title></Head>

      {/* Cloudflare Turnstile — load only on register page */}
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad"
          strategy="lazyOnload"
        />
      )}

      <div className="min-h-screen flex" style={{ background: 'var(--ios-bg)' }}>
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg,#5856d6 0%,#007aff 60%,#34c759 100%)' }}>
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.2)' }}>SW</div>
              <span className="text-white font-bold text-lg">StockWise</span>
            </div>
          </div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-sm text-white font-medium"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              ✨ 30-Day Deluxe Free Trial
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-3">
              Your inventory,<br />supercharged.
            </h1>
            <p className="text-blue-100 text-lg">No credit card required.<br />Cancel anytime.</p>
          </div>
          <div className="relative space-y-2.5">
            {['Full Deluxe access — 30 days free','Real-time stock tracking','Smart low-stock alerts','Sales analytics & reports'].map(f => (
              <div key={f} className="flex items-center gap-2 text-white/90 text-sm">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm animate-ios-in">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg,#5856d6,#007aff)' }}>SW</div>
              <span className="font-bold" style={{ color: 'var(--ios-text)' }}>StockWise</span>
            </div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--ios-text)' }}>Create account</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--ios-text2)' }}>Start your 30-day Deluxe trial</p>
            <div className="card p-6">
              <RegisterForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
