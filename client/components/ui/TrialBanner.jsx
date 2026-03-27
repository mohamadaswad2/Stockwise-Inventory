import { AlertTriangle, Zap } from 'lucide-react';
import Link from 'next/link';

export default function TrialBanner({ user }) {
  if (!user?.trial_ends_at || user?.stripe_subscription_id) return null;

  const daysLeft = Math.ceil((new Date(user.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return null;

  const isUrgent = daysLeft <= 3;

  return (
    <div className={`flex items-center justify-between px-6 py-2.5 text-sm
      ${isUrgent
        ? 'bg-red-500 text-white'
        : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white'}`}>
      <div className="flex items-center gap-2">
        {isUrgent ? <AlertTriangle size={15} /> : <Zap size={15} />}
        <span>
          {isUrgent
            ? `⚠️ Trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}! Don't lose access to your data.`
            : `✨ Deluxe trial — ${daysLeft} days remaining`}
        </span>
      </div>
      <Link href="/settings/billing"
        className="text-xs font-semibold underline hover:no-underline flex-shrink-0 ml-4">
        Upgrade Now →
      </Link>
    </div>
  );
}
