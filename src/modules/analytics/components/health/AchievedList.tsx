import { Check } from 'lucide-react';
import type { ListingHealth } from '../../healthTypes';
import { Section } from './Section';

export function AchievedList({ data }: { data: ListingHealth }) {
  const passed = data.breakdown.filter(row => row.sub_score >= 100);
  if (passed.length === 0) return null;
  return (
    <Section title="Đã đạt">
      <ul className="m-0 list-none space-y-2 p-0">
        {passed.map(row => (
          <li key={row.key} className="flex items-center gap-2 text-[13px] text-stone-700">
            <Check size={15} strokeWidth={2.5} className="shrink-0 text-green-700" aria-hidden /> {row.label}
          </li>
        ))}
      </ul>
    </Section>
  );
}
