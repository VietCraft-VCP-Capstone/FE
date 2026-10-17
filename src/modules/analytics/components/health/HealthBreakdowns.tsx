import { ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { HealthAxis, HealthStatus } from '../../types';
import { HEALTH_BANDS } from '../HealthParts';
import { InsightCard } from '../ui';
import { BAND_COLOR, FOCUS, bandOf, type ShopStats } from './healthStats';

const percent = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

const ROW = `flex w-full cursor-pointer items-center gap-3 rounded-lg border-none px-2 py-2 text-left transition-colors duration-150 motion-reduce:transition-none disabled:cursor-default ${FOCUS}`;

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex cursor-pointer items-center gap-1 rounded-md border-none bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700 transition-colors duration-150 hover:bg-stone-200 ${FOCUS}`}>
      <X size={13} aria-hidden /> Bỏ lọc
    </button>
  );
}


export function BandDistribution({ stats, active, onPick, className }: {
  stats: ShopStats;
  active: string;
  onPick: (band: string) => void;
  className?: string;
}) {
  const total = stats.scored.length;
  const lowest = [...stats.scored].sort((a, b) => (a.score as number) - (b.score as number))[0];
  return (
    <InsightCard title="Phân bố mức điểm" info={`Hôm nay có ${total} sản phẩm đã chấm. Bấm vào một mức để lọc bảng bên dưới.`} action={active ? <ClearButton onClick={() => onPick('')} /> : undefined} className={className} bodyClassName="flex flex-col gap-3 px-3 py-4">
      <div
        role="img"
        aria-label={HEALTH_BANDS.map(b => `${b.label} ${stats.bands[b.status]}`).join(', ')}
        className="mx-2 flex h-3 gap-0.5 overflow-hidden rounded-full bg-stone-100"
      >
        {HEALTH_BANDS.filter(b => stats.bands[b.status] > 0).map(b => (
          <span key={b.status} style={{ flexGrow: stats.bands[b.status], flexBasis: 0, backgroundColor: BAND_COLOR[b.status] }} />
        ))}
      </div>
      <div role="group" aria-label="Lọc bảng theo mức điểm" className="flex flex-col">
        {HEALTH_BANDS.map(b => {
          const n = stats.bands[b.status];
          const on = active === b.status;
          return (
            <button
              key={b.status}
              type="button"
              aria-pressed={on}
              disabled={n === 0}
              onClick={() => onPick(on ? '' : b.status)}
              className={`${ROW} ${on ? 'bg-[#F3F7EE]' : 'bg-transparent hover:bg-stone-50'} disabled:opacity-60`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: BAND_COLOR[b.status] }} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className={`block text-[13px] font-semibold ${on ? 'text-[#005B00]' : 'text-stone-800'}`}>{b.label}</span>
                <span className="block text-[11.5px] text-stone-500">{b.range}</span>
              </span>
              <span className="text-sm font-bold tabular-nums text-stone-900">{n}</span>
              <span className="w-10 text-right text-xs tabular-nums text-stone-500">{percent(n, total)}%</span>
            </button>
          );
        })}
        {stats.unscored > 0 && (
          <p className="m-0 px-2 pt-1 text-xs text-stone-500">+ {stats.unscored} sản phẩm đang chấm, có điểm sau khoảng 1 phút.</p>
        )}
      </div>
      {lowest && (
        <Link
          to={`/seller/insights/listings/${lowest.product_id}`}
          className={`mx-2 mt-auto flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2 no-underline transition-colors duration-150 hover:border-stone-400 motion-reduce:transition-none ${FOCUS}`}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[11.5px] text-stone-500">Điểm thấp nhất, nên sửa trước</span>
            <span className="block truncate text-[13px] font-semibold text-stone-800">{lowest.title}</span>
          </span>
          <span className="text-sm font-bold tabular-nums" style={{ color: BAND_COLOR[bandOf(lowest.score as number)] }}>{Math.round(lowest.score as number)}</span>
          <ChevronRight size={16} className="text-stone-400" aria-hidden />
        </Link>
      )}
    </InsightCard>
  );
}


export function IssueBars({ stats, total, active, onPick, className }: {
  stats: ShopStats;
  total: number;
  active: string;
  onPick: (issue: string) => void;
  className?: string;
}) {
  const rows = [...stats.issues].sort((a, b) => b.n - a.n);
  return (
    <InsightCard title="Lỗi phổ biến" info="Số sản phẩm mắc từng lỗi. Bấm vào một lỗi để lọc bảng và sửa cùng lúc các sản phẩm đó." action={active ? <ClearButton onClick={() => onPick('')} /> : undefined} className={className} bodyClassName="px-3 py-3">
      <div role="group" aria-label="Lọc bảng theo lỗi" className="flex flex-col">
        {rows.map(({ key, label, n }) => {
          const on = active === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              disabled={n === 0 && !on}
              onClick={() => onPick(on ? '' : key)}
              className={`${ROW} flex-wrap gap-y-1.5 sm:flex-nowrap ${on ? 'bg-[#F3F7EE]' : 'bg-transparent hover:bg-stone-50'}`}
            >
              <span className={`min-w-0 flex-1 text-[13px] font-semibold sm:w-28 sm:flex-none ${on ? 'text-[#005B00]' : n ? 'text-stone-800' : 'text-stone-400'}`}>{label}</span>
              <span className="order-last h-2.5 min-w-0 basis-full overflow-hidden rounded-full bg-stone-100 sm:order-none sm:basis-0 sm:flex-1">
                <span
                  className={`block h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${on ? 'bg-[#007700]' : key === 'warning' ? 'bg-amber-600' : 'bg-stone-500'}`}
                  style={{ width: `${percent(n, total)}%` }}
                />
              </span>
              <span className="w-[6.5rem] shrink-0 whitespace-nowrap text-right text-[13px] tabular-nums">
                <b className={n ? 'text-stone-900' : 'text-stone-400'}>{n}</b>
                <span className="text-xs text-stone-500"> · {percent(n, total)}%</span>
              </span>
            </button>
          );
        })}
      </div>
    </InsightCard>
  );
}


const AXIS_SHORT: Record<HealthAxis, { label: string; missing: string }> = {
  content: { label: 'Nội dung', missing: 'chưa có nội dung' },
  inventory: { label: 'Tồn kho', missing: 'hàng làm theo yêu cầu' },
  freshness: { label: 'Độ cập nhật', missing: 'chưa rõ lần sửa gần nhất' },
  rating: { label: 'Đánh giá', missing: 'chưa có đánh giá nào' },
  conversion: { label: 'Tỉ lệ mua', missing: 'cần ~100 lượt xem / 30 ngày' },
};

export function AxisAverages({ stats, className }: { stats: ShopStats; className?: string }) {
  const nScored = stats.scored.length;
  return (
    <InsightCard title="Điểm trung bình từng tiêu chí" info="Trung bình điểm 0–100 của từng tiêu chí, chỉ tính trên sản phẩm đã có dữ liệu cho tiêu chí đó. Xanh từ 80, vàng 50–79, đỏ dưới 50." className={className} bodyClassName="px-4 py-3">
      <ul className="m-0 flex list-none flex-col p-0">
        {stats.axes.map(({ axis, avg, n }) => (
          <li key={axis} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5 sm:flex-nowrap">
            <span className="min-w-0 flex-1 text-[13px] font-semibold text-stone-800 sm:w-28 sm:flex-none">{AXIS_SHORT[axis].label}</span>
            {avg === null ? (
              <span className="order-last flex min-h-6 min-w-0 basis-full items-center rounded-md border border-dashed border-stone-300 px-2 py-0.5 text-xs text-stone-500 sm:order-none sm:basis-0 sm:flex-1">
                <span>Chưa tính · {AXIS_SHORT[axis].missing}</span>
              </span>
            ) : (
              <>
                <span className="order-last h-2.5 min-w-0 basis-full overflow-hidden rounded-full bg-stone-100 sm:order-none sm:basis-0 sm:flex-1">
                  <span className="block h-full rounded-full" style={{ width: `${avg}%`, backgroundColor: BAND_COLOR[bandOf(avg) as HealthStatus] }} />
                </span>
                <span className="w-[6.5rem] shrink-0 whitespace-nowrap text-right text-[13px] tabular-nums">
                  <b className="text-stone-900">{Math.round(avg)}</b>
                  <span className="text-xs text-stone-500"> · {n}/{nScored} sp</span>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </InsightCard>
  );
}
