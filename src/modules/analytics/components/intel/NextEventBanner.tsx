import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { shortDate } from '../../format';
import { useInsight } from '../../hooks/useInsight';
import type { IntelCalendar } from '../../intelTypes';
import { INSIGHTS_ROOT } from '../../nav';

export function NextEventBanner() {
  const { state } = useInsight<IntelCalendar>('/trends/calendar');
  if (state.kind !== 'ready' || state.data.events.length === 0) return null;
  const event = state.data.events[0];
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  const prepNow = event.prep_start.slice(0, 10) <= today;
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-stone-600">
      <CalendarClock size={16} aria-hidden className="shrink-0 text-[#007700]" />
      <span>
        <strong className="font-semibold text-stone-900">{event.name} {shortDate(event.date)}:</strong>{' '}
        {prepNow ? 'nên chuẩn bị hàng ngay.' : `bắt đầu chuẩn bị từ ${shortDate(event.prep_start)}.`}
      </span>
      <Link to={`${INSIGHTS_ROOT}/seasonal`} className="font-semibold text-[#007700] no-underline hover:underline">Xem lịch mùa vụ</Link>
    </p>
  );
}
