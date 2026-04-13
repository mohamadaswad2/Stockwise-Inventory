/**
 * MetricTooltip - Simple tooltip with "?" icon for metric explanations
 * Shows helpful context on hover, hides on mouse leave
 */
import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export default function MetricTooltip({ description }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs
                   transition-colors duration-200 hover:opacity-100 focus:outline-none"
        style={{
          color: 'var(--text3)',
          opacity: 0.6,
        }}
        aria-label={`Info: ${description}`}
      >
        <HelpCircle size={14} />
      </button>

      {show && (
        <div
          className="absolute z-50 px-3 py-2 text-xs rounded-lg shadow-lg animate-fade-in pointer-events-none"
          style={{
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--surface)',
            border: '1px solid var(--border2)',
            color: 'var(--text)',
            maxWidth: '220px',
            wordBreak: 'keep-all',
            lineHeight: '1.5',
          }}
        >
          {description}
          {/* Arrow */}
          <div
            className="absolute w-2 h-2 rotate-45"
            style={{
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--surface)',
              borderRight: '1px solid var(--border2)',
              borderBottom: '1px solid var(--border2)',
            }}
          />
        </div>
      )}
    </div>
  );
}
