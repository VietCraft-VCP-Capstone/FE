import { useState, useEffect } from 'react';
import { scoreText } from '../../format';
import { healthTier } from './tier';

const R = 44;
const C = 2 * Math.PI * R;

export function ScoreRing({
  score,
  size = 130,
}: {
  score: number | null;
  size?: number;
  potential?: number | null;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const tier = healthTier(score);
  const value = Math.max(0, Math.min(100, score ?? 0));
  const text = scoreText(score);
  const strokeDash = mounted ? (C * value) / 100 : 0;

  // Determine elegant dual-tone gradient based on score tier
  const gradStart = tier.tone === 'good' ? '#059669' : tier.tone === 'warn' ? '#d97706' : '#e11d48';
  const gradEnd = tier.tone === 'good' ? '#10b981' : tier.tone === 'warn' ? '#f59e0b' : '#f43f5e';

  return (
    <div className="relative flex items-center justify-center shrink-0">
      {/* Soft ambient glow behind ring */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-20 pointer-events-none"
        style={{ background: gradStart }}
      />

      <svg
        viewBox="0 0 108 108"
        width={size}
        height={size}
        role="img"
        aria-label={`${text} trên 100`}
        className="shrink-0 relative z-10"
      >
        <defs>
          <linearGradient id="scoreRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="100%" stopColor={gradEnd} />
          </linearGradient>
        </defs>

        {/* Background Track */}
        <circle
          cx="54"
          cy="54"
          r={R}
          fill="none"
          stroke="#f5f5f4"
          strokeWidth="7"
        />

        {/* Dynamic Progress Arc */}
        <circle
          cx="54"
          cy="54"
          r={R}
          fill="none"
          stroke="url(#scoreRingGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${C}`}
          transform="rotate(-90 54 54)"
          className="transition-all duration-700 ease-out"
        />

        {/* Score Value Text */}
        <text
          x="54"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-sans font-black tracking-tighter"
          fontSize="32"
          fill="#1c1917"
        >
          {text}
        </text>
        <text
          x="54"
          y="68"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-sans font-semibold uppercase tracking-wider"
          fontSize="9"
          fill="#a8a29e"
        >
          trên 100
        </text>
      </svg>
    </div>
  );
}
