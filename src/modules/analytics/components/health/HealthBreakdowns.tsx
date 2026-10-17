import { X } from 'lucide-react';
import { HEALTH_BANDS } from '../HealthParts';
import { InsightCard } from '../ui';
import { AXIS_SHORT, BAND_COLOR, FOCUS, bandOf, type ShopStats } from './healthStats';

const percent = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

export function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex cursor-pointer items-center gap-1 rounded-md border-none bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700 transition-colors duration-150 hover:bg-stone-200 ${FOCUS}`}>
      <X size={13} aria-hidden /> Bỏ lọc
    </button>
  );
}

export function IssueBars({ stats, total, scope, active, onPick, className }: {
  stats: ShopStats;
  scope?: string;
  total: number;
  active: string;
  onPick: (issue: string) => void;
  className?: string;
}) {
  const rows = [...stats.issues].sort((a, b) => b.n - a.n);
  return (
    <InsightCard
      title="Nên sửa gì trước?"
      description={scope ? `Chỉ đếm sản phẩm ${scope}.` : undefined}
      info="Mỗi dòng là một lỗi và số sản phẩm đang mắc. Bấm vào để lọc bảng, sửa liền một lượt các sản phẩm cùng lỗi."
      action={active ? <ClearButton onClick={() => onPick('')} /> : undefined}
      className={className}
      bodyClassName="px-3 py-2"
    >
      <div role="group" aria-label="Lọc bảng theo lỗi" className="flex flex-col">
        {rows.map(({ key, label, hint, n }) => {
          const on = active === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              disabled={n === 0 && !on}
              onClick={() => onPick(on ? '' : key)}
              className={`grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 rounded-lg border-none px-2 py-2 text-left transition-colors duration-150 disabled:cursor-default motion-reduce:transition-none sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_auto] ${FOCUS} ${on ? 'bg-[#F3F7EE]' : 'bg-transparent hover:bg-stone-50'}`}
            >
              <span className="min-w-0">
                <span className={`block text-[13px] font-semibold ${on ? 'text-[#005B00]' : n ? 'text-stone-800' : 'text-stone-400'}`}>{label}</span>
                <span className="block text-[11.5px] leading-snug text-stone-500">{hint}</span>
              </span>
              <span className="order-last col-span-2 h-2 overflow-hidden rounded-full bg-stone-100 sm:order-none sm:col-span-1">
                <span
                  className={`block h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${on ? 'bg-[#007700]' : key === 'warning' ? 'bg-amber-600' : 'bg-stone-500'}`}
                  style={{ width: `${percent(n, total)}%` }}
                />
              </span>
              <span className="whitespace-nowrap text-right text-[13px] tabular-nums">
                <b className={n ? 'text-stone-900' : 'text-stone-400'}>{n}</b>
                <span className="text-xs text-stone-500"> sản phẩm</span>
              </span>
            </button>
          );
        })}
      </div>
    </InsightCard>
  );
}

export function AxisAverages({ stats, active, onPick, className }: {
  stats: ShopStats;
  active: string;
  onPick: (axis: string) => void;
  className?: string;
}) {
  const nScored = stats.scored.length;
  return (
    <InsightCard
      title="Shop mạnh, yếu ở đâu?"
      info="Mỗi dòng là một phần được chấm. Thanh màu cho biết bao nhiêu sản phẩm Tốt (xanh), Nên sửa thêm (vàng), Cần sửa gấp (đỏ) ở phần đó. Bấm vào để xem bảng xếp theo điểm phần đó, thấp nhất lên đầu."
      action={active ? <ClearButton onClick={() => onPick('')} /> : undefined}
      className={className}
      bodyClassName="px-3 py-2"
    >
      <div role="group" aria-label="Xếp bảng theo từng phần" className="flex flex-col">
        {stats.axes.map(({ axis, avg, n, bands }) => {
          const on = active === axis;
          const weak = bands.poor + bands.needs_improvement;
          return (
            <button
              key={axis}
              type="button"
              aria-pressed={on}
              disabled={avg === null}
              onClick={() => onPick(on ? '' : axis)}
              className={`grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 rounded-lg border-none px-2 py-2 text-left transition-colors duration-150 disabled:cursor-default motion-reduce:transition-none sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] ${FOCUS} ${on ? 'bg-[#F3F7EE]' : 'bg-transparent hover:bg-stone-50'}`}
            >
              <span className="min-w-0">
                <span className={`block text-[13px] font-semibold ${on ? 'text-[#005B00]' : 'text-stone-800'}`}>{AXIS_SHORT[axis].label}</span>
                <span className="block text-[11.5px] text-stone-500">
                  {avg === null ? `Chưa tính · ${AXIS_SHORT[axis].missing}` : weak ? `${weak} sản phẩm nên sửa` : 'Tất cả đã tốt'}
                </span>
              </span>
              <span className="order-last col-span-2 flex h-2 gap-0.5 overflow-hidden rounded-full bg-stone-100 sm:order-none sm:col-span-1" aria-label={HEALTH_BANDS.map(b => `${b.label} ${bands[b.status]}`).join(', ')} role="img">
                {HEALTH_BANDS.filter(b => bands[b.status] > 0).map(b => (
                  <span key={b.status} style={{ flexGrow: bands[b.status], flexBasis: 0, backgroundColor: BAND_COLOR[b.status] }} />
                ))}
              </span>
              <span className="whitespace-nowrap text-right text-[13px] tabular-nums">
                {avg === null ? <span className="text-xs text-stone-400">—</span> : (
                  <>
                    <b style={{ color: BAND_COLOR[bandOf(avg)] }}>{Math.round(avg)}</b>
                    <span className="text-xs text-stone-500"> · {n}/{nScored} sp</span>
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </InsightCard>
  );
}
