import { AlertTriangle, CheckCircle2, Hourglass } from 'lucide-react';
import type { AlertGroup } from '../alertGroups';
import { describe, isRecent, nextStep, worst } from '../alertText';
import { shortDate } from '../format';

const TONE = {
  bad: 'border-red-200 bg-red-50 text-red-800',
  good: 'border-[#CFE0C0] bg-[#EAF0E2] text-[#005B00]',
  idle: 'border-stone-200 bg-stone-50 text-stone-700',
};

/** The one answer a seller needs first: is my shop okay right now? */
export function AlertVerdict({ groups, idle, limitation }: { groups: AlertGroup[]; idle: boolean; limitation: string | null }) {
  const recent = groups.filter(g => g.alert.direction === 'drop' && isRecent(g));
  const top = worst(recent);
  const lastDrop = groups.find(g => g.alert.direction === 'drop');

  const more = recent.length > 1 ? `Còn ${recent.length - 1} vấn đề khác ở bên dưới.` : '';
  const [tone, Icon, title, sub, action] = idle
    ? ['idle', Hourglass, 'Chưa đủ dữ liệu để đánh giá', limitation ?? 'Shop cần bán ít nhất 28 ngày để hệ thống biết mức bình thường.', ''] as const
    : top
      ? ['bad', AlertTriangle, describe(top).headline, describe(top).detail, nextStep(top)] as const
      : ['good', CheckCircle2, 'Mọi thứ ổn trong 7 ngày qua',
        lastDrop ? `Lần cuối có vấn đề là ngày ${shortDate(lastDrop.alert.date)}.` : 'Chưa từng có ngày nào tụt bất thường.', ''] as const;

  return (
    <div role="status" className={`flex items-start gap-3 rounded-xl border p-4 ${TONE[tone]}`}>
      <Icon size={26} className="mt-0.5 shrink-0" aria-hidden />
      <div>
        <p className="m-0 text-lg font-bold leading-snug">{title}</p>
        <p className="mb-0 mt-1 text-sm tabular-nums opacity-90">{sub}</p>
        {action && <p className="mb-0 mt-1 text-sm font-semibold">{action}</p>}
        {tone === 'bad' && more && <p className="mb-0 mt-1 text-xs opacity-80">{more}</p>}
      </div>
    </div>
  );
}
