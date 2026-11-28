import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { AlertGroup } from '../alertGroups';
import { describe } from '../alertText';
import { Chip, type Tone } from './ui';

const SEVERITY: Record<string, { label: string; tone: Tone }> = {
  high: { label: 'Nặng', tone: 'bad' },
  medium: { label: 'Vừa', tone: 'warn' },
  low: { label: 'Nhẹ', tone: 'neutral' },
};

function AlertItem({ group }: { group: AlertGroup }) {
  const a = group.alert;
  const drop = a.direction === 'drop';
  const { headline, detail } = describe(group);
  const sev = drop ? SEVERITY[a.severity] : undefined;
  const products = a.rule === 'zero_run' ? '' : a.top_listings.slice(0, 3).map(l => l.title).join(', ');
  return (
    <li className="flex items-start gap-3 py-3">
      <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${drop ? 'bg-red-50 text-red-700' : 'bg-stone-100 text-stone-600'}`} aria-hidden>
        {drop ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="m-0 font-semibold text-stone-900">{headline}</p>
          {sev && <Chip tone={sev.tone}>{sev.label}</Chip>}
          {a.calendar_sensitive && <Chip tone="warn">Dịp lễ</Chip>}
          {a.confidence === 'low_history' && <Chip tone="neutral">Ít dữ liệu</Chip>}
        </div>
        <p className="m-0 mt-0.5 text-sm tabular-nums text-stone-500">{detail}</p>
        {products && <p className="m-0 mt-1 truncate text-xs text-stone-500" title={products}>Ảnh hưởng nhiều nhất: {products}</p>}
      </div>
    </li>
  );
}

export function AlertsTable({ groups }: { groups: AlertGroup[] }) {
  return (
    <ul className="m-0 list-none divide-y divide-stone-100 p-0">
      {groups.map(g => <AlertItem key={g.alert.id} group={g} />)}
    </ul>
  );
}
