import Link from 'next/link';

export default function TrialBanner({ user }) {
  if (!user?.trial_ends_at || user?.stripe_subscription_id) return null;
  const days = Math.ceil((new Date(user.trial_ends_at) - new Date()) / 86400000);
  if (days <= 0) return null;

  const urgent = days <= 3;
  return (
    <div className="flex items-center justify-between px-5 py-2 text-xs font-medium"
      style={{
        background: urgent
          ? 'linear-gradient(90deg,#ef4444,#dc2626)'
          : 'linear-gradient(90deg,var(--accent),var(--accent2))',
        color: '#fff',
      }}>
      <span>
        {urgent
          ? `⚠️ Trial expires in ${days} day${days !== 1 ? 's' : ''} — upgrade to keep access`
          : `✨ Deluxe trial — ${days} days remaining`}
      </span>
      <Link href="/settings/billing"
        className="underline hover:no-underline font-bold ml-4 flex-shrink-0 opacity-90 hover:opacity-100">
        Upgrade →
      </Link>
    </div>
  );
}
