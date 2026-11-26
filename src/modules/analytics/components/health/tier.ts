import type { Tone } from '../ui';

export const TIER_COLOR: Record<Tone, string> = {
  good: '#007700', warn: '#b45309', bad: '#BA1A1A', neutral: '#6B7280', info: '#0369a1', brand: '#007700',
};

export function healthTier(score: number | null): { label: string; tone: Tone } {
  if (score === null) return { label: 'Thiếu dữ liệu', tone: 'neutral' };
  if (score >= 80) return { label: 'Tốt', tone: 'good' };
  if (score >= 50) return { label: 'Cần cải thiện', tone: 'warn' };
  return { label: 'Yếu', tone: 'bad' };
}
