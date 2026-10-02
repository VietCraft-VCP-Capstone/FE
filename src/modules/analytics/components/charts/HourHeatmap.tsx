import { useMemo, useState } from 'react';
import { count as fmtCount, money } from '../../../../shared/utils/format';

/**
 * Nhịp đơn hàng theo thứ và giờ (giờ Việt Nam, BR-185).
 *
 * Dùng MỘT tông màu đậm dần thay vì dải xanh-đỏ: dải hai màu buộc người mù màu đỏ-lục
 * phải đoán, còn một tông thì thứ tự đậm nhạt vẫn đọc được. Ô có đơn luôn kèm số ở
 * tooltip và ở bảng chú giải, nên màu không phải kênh thông tin duy nhất.
 */

export interface HeatCell {
  /** 1 = Thứ Hai … 7 = Chủ Nhật. */
  dow: number;
  hour: number;
  orders: number;
  revenue_vnd?: number;
}

const DOW_LABEL: Record<number, string> = {
  1: 'Thứ Hai', 2: 'Thứ Ba', 3: 'Thứ Tư', 4: 'Thứ Năm', 5: 'Thứ Sáu', 6: 'Thứ Bảy', 7: 'Chủ Nhật',
};
const DOW_SHORT: Record<number, string> = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 7: 'CN' };
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const DAYS = [1, 2, 3, 4, 5, 6, 7];

/** 5 bậc đậm dần của xanh thương hiệu, cộng một bậc "không có đơn". */
const STEPS = ['#f5f7f4', '#dbe8d7', '#b4d3ac', '#7fb673', '#4b9340', '#1a6b1a'];

export function HourHeatmap({ cells, peak }: {
  cells: HeatCell[];
  peak?: { dow: number; hour: number } | null;
}) {
  const [hovered, setHovered] = useState<HeatCell | null>(null);

  const { map, max } = useMemo(() => {
    const m = new Map<string, HeatCell>();
    let top = 0;
    for (const c of cells) {
      m.set(`${c.dow}-${c.hour}`, c);
      if (c.orders > top) top = c.orders;
    }
    return { map: m, max: top };
  }, [cells]);

  const stepOf = (orders: number) => {
    if (!orders) return 0;
    if (max <= 1) return STEPS.length - 1;
    return Math.min(STEPS.length - 1, 1 + Math.floor(((orders - 1) / max) * (STEPS.length - 1)));
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div className="min-w-[620px]">
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: '34px repeat(24, minmax(0, 1fr))' }}>
            <span />
            {HOURS.map(h => (
              <span key={h} className="text-center text-[9.5px] leading-none text-stone-400">
                {h % 3 === 0 ? h : ''}
              </span>
            ))}
            {DAYS.map(dow => (
              <div key={dow} className="contents">
                <span className="flex items-center text-[10.5px] font-semibold text-stone-500">{DOW_SHORT[dow]}</span>
                {HOURS.map(h => {
                  const cell = map.get(`${dow}-${h}`);
                  const orders = cell?.orders ?? 0;
                  const isPeak = peak?.dow === dow && peak?.hour === h;
                  return (
                    <button
                      type="button"
                      key={h}
                      onMouseEnter={() => setHovered(cell ?? { dow, hour: h, orders: 0 })}
                      onFocus={() => setHovered(cell ?? { dow, hour: h, orders: 0 })}
                      onMouseLeave={() => setHovered(null)}
                      onBlur={() => setHovered(null)}
                      title={`${DOW_LABEL[dow]} ${String(h).padStart(2, '0')}:00 · ${fmtCount(orders)} đơn`}
                      aria-label={`${DOW_LABEL[dow]} ${h} giờ, ${fmtCount(orders)} đơn`}
                      className={`h-5 w-full cursor-pointer rounded-[3px] border-none p-0 transition-transform duration-150 hover:ring-2 hover:ring-[#007700]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007700] motion-reduce:transition-none ${isPeak ? 'ring-2 ring-[#005B00]' : ''}`}
                      style={{ background: STEPS[stepOf(orders)] }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
        <div className="flex items-center gap-1.5">
          <span>Ít đơn</span>
          {STEPS.map((c, i) => (
            <span key={c} className="h-3 w-5 rounded-[3px]" style={{ background: c }} aria-hidden title={i === 0 ? 'Không có đơn' : undefined} />
          ))}
          <span>Nhiều đơn (cao nhất {fmtCount(max)})</span>
        </div>
        <p aria-live="polite" className="m-0 min-h-[1.25rem] font-medium text-stone-700">
          {hovered
            ? `${DOW_LABEL[hovered.dow]} ${String(hovered.hour).padStart(2, '0')}:00 · ${fmtCount(hovered.orders)} đơn${hovered.revenue_vnd ? ` · ${money(hovered.revenue_vnd)}` : ''}`
            : 'Trỏ vào một ô để xem số đơn của khung giờ đó.'}
        </p>
      </div>
    </div>
  );
}
