import { healthTier, TIER_COLOR } from './intelLabels';

const R = 42;
const C = 2 * Math.PI * R;

export function ScoreRing({ score, size = 112 }: { score: number | null; size?: number }) {
  const tier = healthTier(score);
  const value = Math.max(0, Math.min(100, score ?? 0));
  const text = score === null ? '-' : String(Math.round(score));
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${text} trên 100, ${tier.label}`} className="shrink-0">
      <circle cx="50" cy="50" r={R} fill="none" stroke="#e7e5e4" strokeWidth="9" />
      <circle
        cx="50" cy="50" r={R} fill="none" stroke={TIER_COLOR[tier.tone]} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${(C * value) / 100} ${C}`} transform="rotate(-90 50 50)"
      />
      <text x="50" y="52" textAnchor="middle" dominantBaseline="middle" fontSize="30" fontWeight="800" fill="#1c1917">{text}</text>
    </svg>
  );
}
