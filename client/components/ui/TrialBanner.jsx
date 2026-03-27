import Link from 'next/link';

export default function TrialBanner({ user }) {
  if (!user?.trial_ends_at || user?.stripe_subscription_id) return null;
  const days = Math.ceil((new Date(user.trial_ends_at) - new Date()) / 86400000);
  if (days <= 0) return null;

  const urgent = days <= 3;
  return (
    <div className="flex items-center justify-between px-5 py-2 text-xs font-medium text-white"
      style={{ background: urgent ? 'var(--ios-red)' : 'var(--ios-blue)' }}>
      <span>{urgent ? `⚠️ Trial expires in ${days} day${days!==1?'s':''}!` : `✨ Deluxe trial — ${days} days left`}</span>
      <Link href="/settings/billing" className="underline hover:no-underline font-semibold ml-4 flex-shrink-0">
        Upgrade →
      </Link>
    </div>
  );
}