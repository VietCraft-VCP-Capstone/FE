import { Link } from 'react-router-dom';
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
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-l-2 border-[#007700] bg-stone-50 px-4 py-2.5 text-[13px] text-stone-700">
      <span>
        <strong className="font-semibold text-stone-900">{event.name} ({shortDate(event.date)}):</strong>{' '}
        {prepNow ? 'Cần chuẩn bị hàng ngay để đón sóng mua sắm.' : `Bắt đầu chuẩn bị từ ${shortDate(event.prep_start)}.`}
      </span>
      <Link to={`${INSIGHTS_ROOT}/seasonal`} className="shrink-0 font-semibold text-[#007700] no-underline hover:underline">Xem lịch mùa vụ</Link>
    </div>
  );
}
