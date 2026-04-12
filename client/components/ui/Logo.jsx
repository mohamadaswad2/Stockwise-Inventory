/**
 * StockWise Logo Component
 * - Minimal, geometric, SaaS-style logo
 * - Dark theme with gradient
 * - Clickable to redirect to landing page (/)
 */
import Link from 'next/link';

/**
 * SVG Logo Icon only
 */
export function LogoIcon({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient
          id="sw-logo-grad"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect width="32" height="32" rx="9" fill="url(#sw-logo-grad)" />
      {/* Abstract S-shape / stock chart bars */}
      <rect x="6" y="18" width="5" height="8" rx="1.5" fill="white" opacity="0.9" />
      <rect x="13.5" y="12" width="5" height="14" rx="1.5" fill="white" />
      <rect x="21" y="6" width="5" height="20" rx="1.5" fill="white" opacity="0.7" />
      {/* Trend line */}
      <path
        d="M8.5 17 L16 11 L23.5 5.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

/**
 * Full Logo with Icon + Text
 * @param {Object} props
 * @param {number} props.iconSize - Size of the icon (default: 32)
 * @param {string} props.textClassName - Additional classes for text
 * @param {boolean} props.asLink - Wrap in Link to / (default: true)
 * @param {Function} props.onClick - Optional click handler
 */
export default function Logo({
  iconSize = 32,
  textClassName = '',
  asLink = true,
  onClick,
  showText = true,
}) {
  const content = (
    <div
      className="flex items-center gap-2.5"
      style={{ textDecoration: 'none' }}
      onClick={onClick}
    >
      <LogoIcon size={iconSize} />
      {showText && (
        <span
          className={`font-bold text-white tracking-tight ${textClassName}`}
          style={{ fontSize: iconSize * 0.53, letterSpacing: '-0.3px' }}
        >
          StockWise
        </span>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link href="/" className="no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
