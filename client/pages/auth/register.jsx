import Head from 'next/head';
import RegisterForm from '../../components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <>
      <Head><title>Get Started — StockWise</title></Head>
      <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>

        {/* Left — dark gradient panel */}
        <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg,#0d0d16 0%,#13131a 40%,#1a1030 100%)' }}>

          {/* Glow orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)' }} />

          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          {/* Brand */}
          <div className="relative flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>SW</div>
            <span className="font-bold text-white">StockWise</span>
          </div>

          {/* Hero */}
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.2)' }}>
              ✨ 30 Days Deluxe — FREE
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-3" style={{ letterSpacing: '-1px' }}>
              Your inventory,<br />
              <span style={{ background: 'linear-gradient(135deg,#a78bfa,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                supercharged.
              </span>
            </h1>
            <p className="text-base" style={{ color: 'rgba(255,255,255,0.5)' }}>
              No credit card. Cancel anytime.
            </p>
          </div>

          {/* Features */}
          <div className="relative space-y-3">
            {[
              'Full Deluxe access for 30 days',
              'Real-time stock tracking',
              'Smart low-stock alerts',
              'Sales analytics & reports',
            ].map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs"
                  style={{ background: 'rgba(99,102,241,0.2)', color: '#a78bfa' }}>✓</div>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm animate-ios-in">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>SW</div>
              <span className="font-bold" style={{ color: 'var(--text)' }}>StockWise</span>
            </div>
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>
              Create account
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>Start your 30-day Deluxe trial</p>

            <div className="card-glow p-6">
              <RegisterForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
