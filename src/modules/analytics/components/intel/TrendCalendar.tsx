import { CalendarClock } from 'lucide-react';
import { shortDate } from '../../format';
import { useInsight } from '../../hooks/useInsight';
import type { IntelCalendar } from '../../intelTypes';
import { InsightBlock } from '../InsightBlock';
import { Chip, InsightCard, Note } from '../ui';
import { GROUP_LABEL } from './intelLabels';

type CalendarEvent = IntelCalendar['events'][number];

const day = (iso: string) => iso.slice(0, 10);

function Keyword({ term, momentum }: CalendarEvent['keywords'][number]) {
  if (momentum === null || !Number.isFinite(momentum)) return <Chip className="max-w-full"><span className="truncate">{term}</span></Chip>;
  const dir = Math.abs(momentum) >= 0.01 ? Math.sign(momentum) : 0;
  const arrow = dir > 0 ? '↑' : dir < 0 ? '↓' : '→';
  const word = dir > 0 ? 'đang tăng' : dir < 0 ? 'đang giảm' : 'đi ngang';
  const tone = dir > 0 ? 'good' : dir < 0 ? 'bad' : 'neutral';
  return (
    <Chip tone={tone} className="max-w-full">
      <span className="truncate">{term}</span>
      <span aria-hidden>{arrow}</span><span className="sr-only">{word}</span>
      <span className="shrink-0">{dir === 0 ? 0 : Math.round(Math.abs(momentum) * 100)}%</span>
    </Chip>
  );
}

function EventItem({ event, today }: { event: CalendarEvent; today: string }) {
  const prepNow = day(event.prep_start) <= today && day(event.date) >= today;
  return (
    <li className={`space-y-2 border-l-4 py-3 pl-3 first:pt-0 last:pb-0 ${prepNow ? 'border-amber-400' : 'border-transparent'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="m-0 text-sm font-bold text-stone-900">{event.name}</h3>
        <time dateTime={day(event.date)} className="text-sm font-semibold tabular-nums text-stone-700">{shortDate(event.date)}</time>
      </div>
      <p className={`m-0 flex flex-wrap items-center gap-2 text-xs ${prepNow ? 'font-semibold text-amber-900' : 'text-stone-500'}`}>
        <span>Bắt đầu chuẩn bị từ <time dateTime={day(event.prep_start)}>{shortDate(event.prep_start)}</time></span>
        {prepNow && <Chip tone="warn" icon={<CalendarClock size={12} aria-hidden />}>Nên chuẩn bị ngay</Chip>}
      </p>
      {event.groups.length > 0 && (
        <ul aria-label="Nhóm sản phẩm liên quan" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {event.groups.map(g => <li key={g}><Chip tone="info">{GROUP_LABEL[g] ?? g}</Chip></li>)}
        </ul>
      )}
      {event.keywords.length > 0 && (
        <ul aria-label="Từ khoá thường tăng quanh sự kiện" className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {event.keywords.slice(0, 3).map(k => <li key={k.term} className="min-w-0 max-w-full"><Keyword {...k} /></li>)}
        </ul>
      )}
      {event.keywords.slice(0, 3).some(k => k.momentum === null) && <p className="m-0 text-[11px] text-stone-500">Đà tăng gần đây: chưa có dữ liệu mới.</p>}
    </li>
  );
}

export function TrendCalendar({ group }: { group?: string | null }) {
  const { state, reload } = useInsight<IntelCalendar>('/trends/calendar');
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  return (
    <InsightCard
      title="Lịch mùa vụ 12 tuần tới"
      info="Các dịp mua sắm sắp tới, ngày nên bắt đầu chuẩn bị hàng và từ khoá thường tăng quanh dịp đó. Mũi tên cạnh từ khoá là đà tăng hoặc giảm gần đây, chỉ để tham khảo."
    >
      <InsightBlock state={state} onRetry={reload} compact>
        {data => {
          const events = data.events
            .filter(e => !group || e.groups.length === 0 || e.groups.includes(group))
            .sort((a, b) => day(a.date).localeCompare(day(b.date)));
          if (events.length === 0) return <Note>{group ? 'Chưa có dịp mua sắm nào trong 12 tuần tới phù hợp với nhóm sản phẩm này.' : 'Chưa có dịp mua sắm nào trong 12 tuần tới.'}</Note>;
          return (
            <ol className="m-0 list-none divide-y divide-stone-100 p-0">
              {events.map(e => <EventItem key={e.key} event={e} today={today} />)}
            </ol>
          );
        }}
      </InsightBlock>
    </InsightCard>
  );
}
