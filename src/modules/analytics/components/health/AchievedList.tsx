import { Tag } from 'antd';
import { CheckCircle2, Check } from 'lucide-react';
import type { ListingHealth } from '../../healthTypes';
import { Section } from './Section';

export function AchievedList({ data }: { data: ListingHealth }) {
  const passed = data.breakdown.filter(row => row.sub_score >= 100);
  if (passed.length === 0) return null;

  return (
    <Section
      title="Tiêu chí đã đạt chuẩn"
      subtitle="Các phần đã đáp ứng 100% tiêu chuẩn chất lượng"
      icon={<CheckCircle2 size={18} />}
      extra={
        <Tag color="green" className="!m-0 font-jakarta text-xs font-bold">
          {passed.length} / {data.breakdown.length} tiêu chí
        </Tag>
      }
    >
      <ul className="m-0 grid list-none gap-2.5 p-0">
        {passed.map(row => (
          <li
            key={row.key}
            className="flex items-center justify-between rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-3 transition-colors hover:bg-emerald-50/70"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#007700]">
                <Check size={13} strokeWidth={3} />
              </div>
              <span className="font-jakarta text-xs font-bold text-stone-900">{row.label}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-jakarta text-xs font-semibold tabular-nums text-[#007700]">
                {row.weight} / {row.weight} điểm
              </span>
              <Tag color="green" className="!m-0 text-[10px] font-bold uppercase tracking-wider">
                Đạt tối đa
              </Tag>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
