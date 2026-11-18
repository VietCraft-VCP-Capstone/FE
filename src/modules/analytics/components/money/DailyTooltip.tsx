import { money } from '../../../../shared/utils/format';
import type { ChartMode, DayPoint } from './dailyData';

const PAD_L = 40;
const PAD_R = 8;

function DayLines({ p }: { p: DayPoint }) {
  return p.orders === 0 ? <p className="text-stone-500">Không có đơn</p> : (
    <>
      <p className={p.net < 0 ? 'text-red-600' : 'text-stone-700'}>
        Thực nhận: {money(p.net)}{p.net < 0 && ' (hoàn tiền nhiều hơn tiền về)'}
      </p>
      <p className="text-stone-700">Số đơn: {p.orders}</p>
    </>
  );
}

function CumLines({ p }: { p: DayPoint }) {
  const word = p.full.startsWith('Tuần') ? 'Trong tuần' : 'Trong ngày';
  return (
    <>
      <p className="font-semibold text-stone-900">Cộng dồn: {money(p.cum)}</p>
      {p.orders === 0 ? <p className="text-stone-500">{word}: không có đơn</p> : (
        <p className={p.net < 0 ? 'text-red-600' : 'text-stone-700'}>{word}: {money(p.net)} · {p.orders} đơn</p>
      )}
    </>
  );
}

export function DailyTooltip({ point: p, mode }: { point: DayPoint; mode: ChartMode }) {
  return (
    <div className="whitespace-nowrap rounded-md border border-stone-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-bold text-stone-900">{p.full}</p>
      {mode === 'cum' ? <CumLines p={p} /> : <DayLines p={p} />}
    </div>
  );
}

/** rel: vị trí cột trong vùng vẽ, 0..1 */
export function DailyHoverTip({ point, rel, mode }: { point: DayPoint; rel: number; mode: ChartMode }) {
  return (
    <div
      className="pointer-events-none absolute top-2 z-10"
      style={{ left: `calc(${PAD_L}px + (100% - ${PAD_L + PAD_R}px) * ${rel})`, transform: rel > 0.6 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)' }}
    >
      <DailyTooltip point={point} mode={mode} />
    </div>
  );
}
